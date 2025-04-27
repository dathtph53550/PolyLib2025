const db = require('./db');

const registrationSchema = new db.mongoose.Schema({
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
    requestDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    desiredBorrowDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'expired'],
        default: 'pending'
    },
    note: {
        type: String
    },
    processedBy: {
        type: db.mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: {
        type: Date
    },
    borrowTicket: {
        type: db.mongoose.Schema.Types.ObjectId,
        ref: 'BorrowTicket'
    }
}, { 
    collection: 'registrations',
    timestamps: true 
});

// Middleware để tạo phiếu mượn khi đăng ký được duyệt
registrationSchema.pre('save', async function(next) {
    if (this.isModified('status') && this.status === 'approved' && !this.borrowTicket) {
        try {
            const BorrowTicket = db.mongoose.model('BorrowTicket');
            const borrowTicket = new BorrowTicket({
                user: this.user,
                book: this.book,
                borrowDate: this.desiredBorrowDate,
                dueDate: new Date(this.desiredBorrowDate.getTime() + (14 * 24 * 60 * 60 * 1000)), // 14 ngày
                status: 'approved',
                approvedBy: this.processedBy,
                approvedAt: this.processedAt
            });
            await borrowTicket.save();
            this.borrowTicket = borrowTicket._id;
        } catch (error) {
            next(error);
        }
    }
    next();
});

const registrationModel = db.mongoose.model('Registration', registrationSchema);
module.exports = { registrationModel }; 