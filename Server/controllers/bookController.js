const { bookModel } = require('../models/book.model');

const bookController = {
    // Lấy danh sách sách
    getAllBooks: async (req, res) => {
        try {
            const query = {};
            
            // Lọc theo thể loại
            if (req.query.category) {
                query.category = req.query.category;
            }

            // Lọc theo trạng thái
            if (req.query.available) {
                query.available = req.query.available === 'true';
            }

            // Tìm kiếm theo tên sách hoặc tác giả
            if (req.query.search) {
                query.$or = [
                    { title: { $regex: req.query.search, $options: 'i' } },
                    { author: { $regex: req.query.search, $options: 'i' } }
                ];
            }

            const books = await bookModel.find(query)
                .populate('category')
                .sort({ createdAt: -1 });

            res.status(200).json({ 
                data: books, 
                msg: 'Lấy danh sách sách thành công' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Lấy thông tin một cuốn sách
    getBook: async (req, res) => {
        try {
            const book = await bookModel.findById(req.params.id)
                .populate('category');
            
            if (!book) {
                return res.status(404).json({ error: 'Không tìm thấy sách' });
            }
            
            res.status(200).json({ data: book });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // [ADMIN] Thêm sách mới
    createBook: async (req, res) => {
        try {
            const book = new bookModel(req.body);
            await book.save();
            
            await book.populate('category');
            res.status(201).json({ 
                data: book, 
                msg: 'Thêm sách thành công' 
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // [ADMIN] Cập nhật thông tin sách
    updateBook: async (req, res) => {
        const updates = Object.keys(req.body);
        const allowedUpdates = [
            'title', 'category', 'rentalPrice', 'author', 
            'publisher', 'description', 'quantity', "image"
        ];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Thông tin cập nhật không hợp lệ!' });
        }
        

        try {
            const book = await bookModel.findById(req.params.id);
            if (!book) {
                return res.status(404).json({ error: 'Không tìm thấy sách' });
            }

            updates.forEach(update => book[update] = req.body[update]);
            await book.save();
            
            await book.populate('category');
            res.status(200).json({ 
                data: book, 
                msg: 'Cập nhật sách thành công' 
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // [ADMIN] Xóa sách
    deleteBook: async (req, res) => {
        try {
            const book = await bookModel.findById(req.params.id);
            if (!book) {
                return res.status(404).json({ error: 'Không tìm thấy sách' });
            }

            // Kiểm tra xem sách có đang được mượn không
            const BorrowTicket = require('../models/borrow_ticket.model').borrowTicketModel;
            const activeBorrows = await BorrowTicket.find({
                book: book._id,
                status: { $in: ['pending', 'approved'] }
            });

            if (activeBorrows.length > 0) {
                return res.status(400).json({ 
                    error: 'Không thể xóa sách đang được mượn hoặc có yêu cầu mượn' 
                });
            }

            await book.deleteOne();
            res.status(200).json({ msg: 'Xóa sách thành công' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // [ADMIN] Cập nhật số lượng sách
    updateQuantity: async (req, res) => {
        try {
            const { quantity } = req.body;
            if (typeof quantity !== 'number' || quantity < 0) {
                return res.status(400).json({ error: 'Số lượng không hợp lệ' });
            }

            const book = await bookModel.findById(req.params.id);
            if (!book) {
                return res.status(404).json({ error: 'Không tìm thấy sách' });
            }

            book.quantity = quantity;
            await book.save();

            res.status(200).json({ 
                data: book, 
                msg: 'Cập nhật số lượng thành công' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = bookController; 