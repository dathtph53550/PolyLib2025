const { returnTicketModel } = require('../models/return_ticket.model');
const { borrowTicketModel } = require('../models/borrow_ticket.model');
const { bookModel } = require('../models/book.model');
const { notificationModel } = require('../models/notification.model');

const returnTicketController = {
    // [ADMIN] Lấy danh sách phiếu trả
    getAllReturnTickets: async (req, res) => {
        try {
            const query = {};
            
            // Lọc theo điều kiện sách
            if (req.query.condition) {
                query.condition = req.query.condition;
            }

            const tickets = await returnTicketModel.find(query)
                .populate({
                    path: 'borrowTicket',
                    populate: [
                        { path: 'user', select: '-password -token' },
                        { path: 'book' }
                    ]
                })
                .populate('processedBy', '-password -token')
                .sort({ createdAt: -1 });

            res.status(200).json({ 
                data: tickets, 
                msg: 'Lấy danh sách phiếu trả thành công' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Lấy thông tin một phiếu trả
    getReturnTicket: async (req, res) => {
        try {
            const ticket = await returnTicketModel.findById(req.params.id)
                .populate({
                    path: 'borrowTicket',
                    populate: [
                        { path: 'user', select: '-password -token' },
                        { path: 'book' }
                    ]
                })
                .populate('processedBy', '-password -token');

            if (!ticket) {
                return res.status(404).json({ error: 'Không tìm thấy phiếu trả' });
            }

            // Kiểm tra quyền xem (chỉ admin hoặc người mượn mới xem được)
            if (req.user.role === 0 && 
                ticket.borrowTicket.user._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'Không có quyền xem phiếu trả này' });
            }

            res.status(200).json({ data: ticket });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // [ADMIN] Tạo phiếu trả
    createReturnTicket: async (req, res) => {
        try {
            const borrowTicket = await borrowTicketModel.findById(req.body.borrowTicket)
                .populate('book')
                .populate('user');

            if (!borrowTicket) {
                return res.status(404).json({ error: 'Không tìm thấy phiếu mượn' });
            }

            if (borrowTicket.status !== 'approved') {
                return res.status(400).json({ error: 'Phiếu mượn không ở trạng thái cho phép trả' });
            }

            // Kiểm tra xem phiếu mượn này đã có phiếu trả chưa
            const existingReturnTicket = await returnTicketModel.findOne({
                borrowTicket: borrowTicket._id
            });

            if (existingReturnTicket) {
                return res.status(400).json({ error: 'Phiếu mượn này đã được trả' });
            }

            // Tính tiền phạt nếu có
            let fine = {
                amount: 0,
                reason: ''
            };

            // Phạt nếu sách bị hỏng hoặc mất
            if (req.body.condition === 'damaged') {
                fine.amount += borrowTicket.book.rentalPrice * 0.5; // Phạt 50% giá sách
                fine.reason = 'Sách bị hư hỏng';
            } else if (req.body.condition === 'lost') {
                fine.amount += borrowTicket.book.rentalPrice * 2; // Phạt 200% giá sách
                fine.reason = 'Sách bị mất';
            }

            // Phạt nếu trả muộn
            const dueDate = new Date(borrowTicket.dueDate);
            const returnDate = new Date();
            if (returnDate > dueDate) {
                const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
                const lateFee = daysLate * 10000; // 10,000 VND mỗi ngày trễ
                fine.amount += lateFee;
                fine.reason += fine.reason ? ' và ' : '';
                fine.reason += `Trả sách trễ ${daysLate} ngày`;
            }

            const returnTicket = new returnTicketModel({
                borrowTicket: borrowTicket._id,
                returnDate: returnDate,
                condition: req.body.condition,
                note: req.body.note,
                fine,
                processedBy: req.user._id
            });
            await returnTicket.save();

            // Cập nhật trạng thái phiếu mượn thành 'returned'
            borrowTicket.status = 'returned';
            borrowTicket.returnDate = returnDate;
            await borrowTicket.save();

            // Cập nhật số lượng sách (nếu sách không bị mất)
            if (req.body.condition !== 'lost') {
                const book = await bookModel.findById(borrowTicket.book._id);
                book.quantity += 1;
                await book.save();
            }

            // Tạo thông báo cho người mượn
            const notification = new notificationModel({
                user: borrowTicket.user._id,
                title: 'Phiếu trả sách đã được xử lý',
                message: `Sách "${borrowTicket.book.title}" đã được xử lý trả${fine.amount > 0 ? `. Tiền phạt: ${fine.amount.toLocaleString('vi-VN')}đ (${fine.reason})` : ''}`,
                type: 'return_ticket',
                relatedTo: {
                    model: 'ReturnTicket',
                    id: returnTicket._id
                }
            });
            await notification.save();

            await returnTicket.populate({
                path: 'borrowTicket',
                populate: [
                    { path: 'user', select: '-password -token' },
                    { path: 'book' }
                ]
            });
            await returnTicket.populate('processedBy', '-password -token');

            res.status(201).json({ 
                data: returnTicket, 
                msg: 'Tạo phiếu trả thành công' 
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // [ADMIN] Cập nhật trạng thái thanh toán tiền phạt
    updateFinePayment: async (req, res) => {
        try {
            const returnTicket = await returnTicketModel.findById(req.params.id)
                .populate({
                    path: 'borrowTicket',
                    populate: [
                        { path: 'user', select: '-password -token' },
                        { path: 'book' }
                    ]
                });

            if (!returnTicket) {
                return res.status(404).json({ error: 'Không tìm thấy phiếu trả' });
            }

            if (returnTicket.fine.amount === 0) {
                return res.status(400).json({ error: 'Phiếu trả không có tiền phạt' });
            }

            returnTicket.fine.paid = true;
            await returnTicket.save();

            // Tạo thông báo cho người mượn
            const notification = new notificationModel({
                user: returnTicket.borrowTicket.user._id,
                title: 'Đã thanh toán tiền phạt',
                message: `Tiền phạt ${returnTicket.fine.amount.toLocaleString('vi-VN')}đ cho sách "${returnTicket.borrowTicket.book.title}" đã được thanh toán`,
                type: 'fine_payment',
                relatedTo: {
                    model: 'ReturnTicket',
                    id: returnTicket._id
                }
            });
            await notification.save();

            res.status(200).json({ 
                data: returnTicket, 
                msg: 'Cập nhật thanh toán tiền phạt thành công' 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = returnTicketController; 