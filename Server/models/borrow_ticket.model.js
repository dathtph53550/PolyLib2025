const db = require('./db');

const borrowTicketSchema = new db.mongoose.Schema({
    user: {
        type: db.mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        type: db.mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    borrowDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'returned'],
        default: 'pending'
    },
    note: {
        type: String
    },
    approvedBy: {
        type: db.mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    returnDate: {
        type: Date
    }
}, { 
    collection: 'borrow_tickets',
    timestamps: true 
});

// Middleware chỉ xử lý khi duyệt phiếu mượn
borrowTicketSchema.pre('save', async function(next) {
    if (this.isNew && this.status === 'approved') {
        try {
            const book = await db.mongoose.model('Book').findById(this.book);
            // Khi duyệt đơn mượn, giảm số lượng sách trong kho
            await db.mongoose.model('Book').findByIdAndUpdate(this.book, { 
                quantity: book.quantity - 1
            });
        } catch (error) {
            next(error);
        }
    }
    next();
});

const borrowTicketModel = db.mongoose.model('BorrowTicket', borrowTicketSchema);
module.exports = { borrowTicketModel }; 