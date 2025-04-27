const { borrowTicketModel } = require('../models/borrow_ticket.model');
const { bookModel } = require('../models/book.model');
const { notificationModel } = require('../models/notification.model');

const borrowTicketController = {
    // Lấy danh sách phiếu mượn (Admin: tất cả, User: chỉ của mình)
    getAllBorrowTickets: async (req, res) => {
        try {
            const query = req.user.role === 0 ? { user: req.user._id } : {};
            
            // Lọc theo trạng thái
            if (req.query.status) {
                query.status = req.query.status;
            }

            const tickets = await borrowTicketModel.find(query)
                .populate('user', '-password -token')
                .populate('book')
                .populate('approvedBy', '-password -token')
                .sort({ createdAt: -1 });

            res.status(200).json({ 
                data: tickets, 
                msg: 'Lấy danh sách phiếu mượn thành công' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Lấy thông tin một phiếu mượn
    getBorrowTicket: async (req, res) => {
        try {
            const ticket = await borrowTicketModel.findById(req.params.id)
                .populate('user', '-password -token')
                .populate('book')
                .populate('approvedBy', '-password -token');

            if (!ticket) {
                return res.status(404).json({ error: 'Không tìm thấy phiếu mượn' });
            }

            // Kiểm tra quyền xem (chỉ admin hoặc chủ phiếu mới xem được)
            if (req.user.role === 0 && ticket.user._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'Không có quyền xem phiếu mượn này' });
            }

            res.status(200).json({ data: ticket });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Tạo phiếu mượn mới
    createBorrowTicket: async (req, res) => {
        try {
            // Kiểm tra sách có tồn tại và có thể mượn không
            const book = await bookModel.findById(req.body.book);
            if (!book) {
                return res.status(404).json({ error: 'Không tìm thấy sách' });
            }
            if (!book.available || book.quantity <= 0) {
                return res.status(400).json({ error: 'Sách hiện không có sẵn để mượn' });
            }

            // Kiểm tra người dùng có đang mượn sách này không
            const existingBorrow = await borrowTicketModel.findOne({
                user: req.user._id,
                book: book._id,
                status: { $in: ['pending', 'approved'] }
            });

            if (existingBorrow) {
                return res.status(400).json({ 
                    error: 'Bạn đã có phiếu mượn cho cuốn sách này' 
                });
            }

            const ticket = new borrowTicketModel({
                ...req.body,
                user: req.user._id,
                status: 'pending'
            });
            await ticket.save();

            // Tạo thông báo cho admin
            const notification = new notificationModel({
                user: req.user._id,
                title: 'Yêu cầu mượn sách mới',
                message: `${req.user.fullname} muốn mượn sách "${book.title}"`,
                type: 'borrow_request',
                relatedTo: {
                    model: 'BorrowTicket',
                    id: ticket._id
                }
            });
            await notification.save();

            await ticket.populate('user', '-password -token');
            await ticket.populate('book');

            res.status(201).json({ 
                data: ticket, 
                msg: 'Tạo phiếu mượn thành công' 
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // [ADMIN] Duyệt/từ chối phiếu mượn
    processBorrowTicket: async (req, res) => {
        try {
            const { status, note } = req.body;
            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
            }

            const ticket = await borrowTicketModel.findById(req.params.id);
            if (!ticket) {
                return res.status(404).json({ error: 'Không tìm thấy phiếu mượn' });
            }

            if (ticket.status !== 'pending') {
                return res.status(400).json({ error: 'Phiếu mượn đã được xử lý' });
            }

            // Nếu duyệt, kiểm tra sách còn có thể mượn không
            if (status === 'approved') {
                const book = await bookModel.findById(ticket.book);
                if (!book.available || book.quantity <= 0) {
                    return res.status(400).json({ error: 'Sách hiện không có sẵn để mượn' });
                }
                // Cập nhật số lượng sách
                book.quantity -= 1;
                await book.save();
            }

            ticket.status = status;
            ticket.note = note;
            ticket.approvedBy = req.user._id;
            ticket.approvedAt = new Date();
            await ticket.save();

            // Tạo thông báo cho người mượn
            const notification = new notificationModel({
                user: ticket.user,
                title: `Phiếu mượn đã được ${status === 'approved' ? 'duyệt' : 'từ chối'}`,
                message: `Phiếu mượn của bạn đã được ${status === 'approved' ? 'duyệt' : 'từ chối'}${note ? ': ' + note : ''}`,
                type: 'borrow_request',
                relatedTo: {
                    model: 'BorrowTicket',
                    id: ticket._id
                }
            });
            await notification.save();

            await ticket.populate('user', '-password -token');
            await ticket.populate('book');
            await ticket.populate('approvedBy', '-password -token');

            res.status(200).json({ 
                data: ticket, 
                msg: `${status === 'approved' ? 'Duyệt' : 'Từ chối'} phiếu mượn thành công` 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = borrowTicketController; 