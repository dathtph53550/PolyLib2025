const db = require('./db');

const notificationSchema = new db.mongoose.Schema({
    user: {
        type: db.mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['borrow_request', 'return_reminder', 'fine_payment', 'system', 'other','return_ticket'],
        required: true
    },
    relatedTo: {
        model: {
            type: String,
            enum: ['BorrowTicket', 'ReturnTicket', 'Book','Registration']
        },
        id: {
            type: db.mongoose.Schema.Types.ObjectId
        }
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }
}, { 
    collection: 'notifications',
    timestamps: true 
});

// Phương thức để đánh dấu thông báo đã đọc
notificationSchema.methods.markAsRead = async function() {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
};

const notificationModel = db.mongoose.model('Notification', notificationSchema);
module.exports = { notificationModel }; 