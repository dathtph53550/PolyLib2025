const { notificationModel } = require('../models/notification.model');

const notificationController = {
    // Lấy danh sách thông báo của user
    getMyNotifications: async (req, res) => {
        try {
            const notifications = await notificationModel.find({ user: req.user._id })
                .sort({ createdAt: -1 })
                .limit(50);  // Giới hạn 50 thông báo gần nhất

            res.status(200).json({ 
                data: notifications, 
                msg: 'Lấy danh sách thông báo thành công' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Đánh dấu thông báo đã đọc
    markAsRead: async (req, res) => {
        try {
            const notification = await notificationModel.findOne({
                _id: req.params.id,
                user: req.user._id
            });

            if (!notification) {
                return res.status(404).json({ error: 'Không tìm thấy thông báo' });
            }

            await notification.markAsRead();
            res.status(200).json({ 
                data: notification, 
                msg: 'Đánh dấu đã đọc thành công' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Đánh dấu tất cả thông báo đã đọc
    markAllAsRead: async (req, res) => {
        try {
            await notificationModel.updateMany(
                { user: req.user._id, isRead: false },
                { 
                    isRead: true,
                    readAt: new Date()
                }
            );

            res.status(200).json({ 
                msg: 'Đánh dấu tất cả thông báo đã đọc thành công' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Xóa một thông báo
    deleteNotification: async (req, res) => {
        try {
            const notification = await notificationModel.findOneAndDelete({
                _id: req.params.id,
                user: req.user._id
            });

            if (!notification) {
                return res.status(404).json({ error: 'Không tìm thấy thông báo' });
            }

            res.status(200).json({ msg: 'Xóa thông báo thành công' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Xóa tất cả thông báo đã đọc
    deleteAllRead: async (req, res) => {
        try {
            await notificationModel.deleteMany({
                user: req.user._id,
                isRead: true
            });

            res.status(200).json({ 
                msg: 'Xóa tất cả thông báo đã đọc thành công' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // [ADMIN] Tạo thông báo cho nhiều người dùng
    createBulkNotifications: async (req, res) => {
        try {
            const { users, title, message, type } = req.body;

            if (!users || !Array.isArray(users) || users.length === 0) {
                return res.status(400).json({ error: 'Danh sách người dùng không hợp lệ' });
            }

            const notifications = users.map(userId => ({
                user: userId,
                title,
                message,
                type: type || 'system'
            }));

            await notificationModel.insertMany(notifications);

            res.status(201).json({ 
                msg: 'Tạo thông báo hàng loạt thành công' 
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = notificationController; 