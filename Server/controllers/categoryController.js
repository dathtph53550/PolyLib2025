const { categoryModel } = require('../models/category.model');

const categoryController = {
    // Lấy danh sách thể loại
    getAllCategories: async (req, res) => {
        try {
            const categories = await categoryModel.find().sort({ name: 1 });
            res.status(200).json({ 
                data: categories, 
                msg: 'Lấy danh sách thể loại thành công' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Lấy thông tin một thể loại
    getCategory: async (req, res) => {
        try {
            const category = await categoryModel.findById(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Không tìm thấy thể loại' });
            }
            res.status(200).json({ data: category });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // [ADMIN] Thêm thể loại mới
    createCategory: async (req, res) => {
        try {
            const category = new categoryModel(req.body);
            await category.save();
            res.status(201).json({ 
                data: category, 
                msg: 'Thêm thể loại thành công' 
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // [ADMIN] Cập nhật thông tin thể loại
    updateCategory: async (req, res) => {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'image'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Thông tin cập nhật không hợp lệ!' });
        }

        try {
            const category = await categoryModel.findById(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Không tìm thấy thể loại' });
            }

            updates.forEach(update => category[update] = req.body[update]);
            await category.save();
            res.status(200).json({ 
                data: category, 
                msg: 'Cập nhật thể loại thành công' 
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // [ADMIN] Xóa thể loại
    deleteCategory: async (req, res) => {
        try {
            const category = await categoryModel.findById(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Không tìm thấy thể loại' });
            }

            // Kiểm tra xem có sách nào thuộc thể loại này không
            const Book = require('../models/book.model').bookModel;
            const booksInCategory = await Book.countDocuments({ category: category._id });

            if (booksInCategory > 0) {
                return res.status(400).json({ 
                    error: 'Không thể xóa thể loại đang có sách' 
                });
            }

            await category.deleteOne();
            res.status(200).json({ msg: 'Xóa thể loại thành công' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = categoryController; 