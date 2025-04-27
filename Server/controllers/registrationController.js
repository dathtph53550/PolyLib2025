const { registrationModel } = require('../models/registration.model');
const { bookModel } = require('../models/book.model');
const { notificationModel } = require('../models/notification.model');
const { borrowTicketModel } = require('../models/borrow_ticket.model');

const registrationController = {
    // Lấy danh sách đăng ký mượn sách (Admin: tất cả, User: chỉ của mình)
    getAllRegistrations: async (req, res) => {
        try {
            const query = req.user.role === 0 ? { user: req.user._id } : {};
            
            // Lọc theo trạng thái
            if (req.query.status) {
                query.status = req.query.status;
            }

            const registrations = await registrationModel.find(query)
                .populate('user', '-password -token')
                .populate('book')
                .populate('processedBy', '-password -token')
                .populate('borrowTicket')
                .sort({ requestDate: -1 });

            res.status(200).json({ 
                data: registrations, 
                msg: 'Lấy danh sách đăng ký mượn sách thành công' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Lấy thông tin một đăng ký
    getRegistration: async (req, res) => {
        try {
            const registration = await registrationModel.findById(req.params.id)
                .populate('user', '-password -token')
                .populate('book')
                .populate('processedBy', '-password -token')
                .populate('borrowTicket');

            if (!registration) {
                return res.status(404).json({ error: 'Không tìm thấy đăng ký mượn sách' });
            }

            // Kiểm tra quyền xem (chỉ admin hoặc chủ đăng ký mới xem được)
            if (req.user.role === 0 && registration.user._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'Không có quyền xem đăng ký này' });
            }

            res.status(200).json({ data: registration });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Tạo đăng ký mượn sách mới
    createRegistration: async (req, res) => {
        try {
            // Kiểm tra sách có tồn tại không
            const book = await bookModel.findById(req.body.book);
            if (!book) {
                return res.status(404).json({ error: 'Không tìm thấy sách' });
            }

            // // Kiểm tra người dùng có đang mượn sách này không
            // const existingBorrow = await borrowTicketModel.findOne({
            //     user: req.user._id,
            //     book: book._id,
            //     status: { $in: ['pending', 'approved'] }
            // });

            // if (existingBorrow) {
            //     return res.status(400).json({ 
            //         error: 'Bạn đang mượn hoặc có yêu cầu mượn cuốn sách này' 
            //     });
            // }

            const registration = new registrationModel({
                user: req.user._id,
                book: req.body.book,
                desiredBorrowDate: req.body.desiredBorrowDate || new Date(),
                note: req.body.note
            });
            await registration.save();

            // Tạo thông báo cho admin
            const notification = new notificationModel({
                user: req.user._id,
                title: 'Đăng ký mượn sách mới',
                message: `${req.user.fullname} đăng ký mượn sách "${book.title}"`,
                type: 'borrow_request',
                relatedTo: {
                    model: 'Registration',
                    id: registration._id
                }
            });
            await notification.save();

            await registration.populate('user', '-password -token');
            await registration.populate('book');

            res.status(201).json({ 
                data: registration, 
                msg: 'Đăng ký mượn sách thành công' 
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // [ADMIN] Duyệt/từ chối đăng ký mượn sách
    processRegistration: async (req, res) => {
        try {
            const { status, note } = req.body;
            if (!['approved', 'rejected', 'cancelled'].includes(status)) {
                return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
            }

            const registration = await registrationModel.findById(req.params.id)
                .populate('book')
                .populate('user');

            if (!registration) {
                return res.status(404).json({ error: 'Không tìm thấy đăng ký mượn sách' });
            }

            if (registration.status !== 'pending') {
                return res.status(400).json({ error: 'Đăng ký này đã được xử lý' });
            }

            // Nếu duyệt, kiểm tra sách còn có thể mượn không
            if (status === 'approved') {
                const book = registration.book;
                if (!book.available || book.quantity <= 0) {
                    return res.status(400).json({ error: 'Sách hiện không có sẵn để mượn' });
                }

                // Tạo phiếu mượn tự động
                const borrowTicket = new borrowTicketModel({
                    user: registration.user._id,
                    book: registration.book._id,
                    borrowDate: registration.desiredBorrowDate,
                    dueDate: new Date(registration.desiredBorrowDate.getTime() + (14 * 24 * 60 * 60 * 1000)), // 14 ngày
                    status: 'approved',
                    note: note,
                    approvedBy: req.user._id,
                    approvedAt: new Date()
                });
                await borrowTicket.save();

                // Cập nhật số lượng sách
                book.quantity = book.quantity - 1;
                await book.save();

                // Liên kết phiếu mượn với đăng ký
                registration.borrowTicket = borrowTicket._id;
            }

            registration.status = status;
            registration.note = note;
            registration.processedBy = req.user._id;
            registration.processedAt = new Date();
            await registration.save();

            // Tạo thông báo cho người đăng ký
            const notification = new notificationModel({
                user: registration.user._id,
                title: `Đăng ký mượn sách đã được ${status === 'approved' ? 'duyệt' : status === 'rejected' ? 'từ chối' : 'hủy'}`,
                message: `Đăng ký mượn sách "${registration.book.title}" của bạn đã được ${status === 'approved' ? 'duyệt' : status === 'rejected' ? 'từ chối' : 'hủy'}${note ? ': ' + note : ''}`,
                type: 'borrow_request',
                relatedTo: {
                    model: 'Registration',
                    id: registration._id
                }
            });
            await notification.save();

            await registration.populate('user', '-password -token');
            await registration.populate('book');
            await registration.populate('processedBy', '-password -token');
            await registration.populate('borrowTicket');

            res.status(200).json({ 
                data: registration, 
                msg: `${status === 'approved' ? 'Duyệt' : status === 'rejected' ? 'Từ chối' : 'Hủy'} đăng ký mượn sách thành công` 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Hủy đăng ký mượn sách (chỉ user có thể hủy đăng ký của mình)
    cancelRegistration: async (req, res) => {
        try {
            const registration = await registrationModel.findOne({
                _id: req.params.id,
                user: req.user._id,
                status: 'pending'
            });

            if (!registration) {
                return res.status(404).json({ 
                    error: 'Không tìm thấy đăng ký mượn sách hoặc không thể hủy' 
                });
            }

            registration.status = 'cancelled';
            registration.note = req.body.note || 'Người dùng tự hủy đăng ký';
            await registration.save();

            res.status(200).json({ 
                data: registration, 
                msg: 'Hủy đăng ký mượn sách thành công' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = registrationController; 