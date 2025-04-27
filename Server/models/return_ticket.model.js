const db = require('./db');

const returnTicketSchema = new db.mongoose.Schema({
    borrowTicket: {
        type: db.mongoose.Schema.Types.ObjectId,
        ref: 'BorrowTicket',
        required: true
    },
    returnDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    condition: {
        type: String,
        enum: ['good', 'damaged', 'lost'],
        required: true,
        default: 'good'
    },
    fine: {
        amount: {
            type: Number,
            default: 0
        },
        reason: {
            type: String
        },
        paid: {
            type: Boolean,
            default: false
        }
    },
    processedBy: {
        type: db.mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    note: {
        type: String
    }
}, { 
    collection: 'return_tickets',
    timestamps: true 
});

const returnTicketModel = db.mongoose.model('ReturnTicket', returnTicketSchema);
module.exports = { returnTicketModel }; 