const { userModel } = require('../models/user.model');

const userController = {
    // Đăng ký tài khoản mới
    register: async (req, res) => {
        try {
            const user = new userModel(req.body);
            const token = await user.generateAuthToken();
            res.status(201).json({ user, token });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Đăng nhập
    login: async (req, res) => {
        try {
            const user = await userModel.findByCredentials(req.body.username, req.body.password);
            const token = await user.generateAuthToken();
            res.status(200).json({ user, token });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Đăng xuất
    logout: async (req, res) => {
        try {
            req.user.token = null;
            await req.user.save();
            res.status(200).json({ msg: 'Đăng xuất thành công' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Lấy thông tin cá nhân
    getProfile: async (req, res) => {
        try {
            res.status(200).json({ data: req.user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Cập nhật thông tin cá nhân
    updateProfile: async (req, res) => {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['fullname', 'email', 'phone', 'address', 'password'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Thông tin cập nhật không hợp lệ!' });
        }

        try {
            updates.forEach(update => req.user[update] = req.body[update]);
            await req.user.save();
            res.status(200).json({ data: req.user, msg: 'Cập nhật thông tin thành công' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // [ADMIN] Lấy danh sách người dùng
    getAllUsers: async (req, res) => {
        try {
            const users = await userModel.find();
            res.status(200).json({ data: users, msg: 'Lấy danh sách thành công' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // [ADMIN] Lấy thông tin một user
    getUser: async (req, res) => {
        try {
            const user = await userModel.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'Không tìm thấy user' });
            }
            res.status(200).json({ data: user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // [ADMIN] Cập nhật thông tin user
    updateUser: async (req, res) => {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['fullname', 'email', 'phone', 'address', 'role', 'status'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Thông tin cập nhật không hợp lệ!' });
        }

        try {
            const user = await userModel.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'Không tìm thấy user' });
            }

            updates.forEach(update => user[update] = req.body[update]);
            await user.save();
            res.status(200).json({ data: user, msg: 'Cập nhật thành công' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // [ADMIN] Xóa user
    deleteUser: async (req, res) => {
        try {
            const user = await userModel.findByIdAndDelete(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'Không tìm thấy user' });
            }
            res.status(200).json({ msg: 'Xóa user thành công' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // [ADMIN] Khóa/Mở khóa tài khoản
    toggleUserStatus: async (req, res) => {
        try {
            const user = await userModel.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'Không tìm thấy user' });
            }

            user.status = user.status === 1 ? 0 : 1;
            await user.save();

            const message = user.status === 1 ? 'Mở khóa' : 'Khóa';
            res.status(200).json({ data: user, msg: `${message} tài khoản thành công` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = userController; 