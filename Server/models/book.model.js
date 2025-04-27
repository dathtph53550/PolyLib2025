const db = require('./db');

const bookSchema = new db.mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    author: { 
        type: String, 
        required: true 
    },
    category: { 
        type: db.mongoose.Schema.Types.ObjectId, 
        ref: 'Category',
        required: true 
    },
    rentalPrice: { 
        type: Number, 
        required: true 
    },
    publisher: {
        type: String 
    },
    quantity: { 
        type: Number, 
        default: 0 
    },
    image: { 
        type: String 
    },
    isHot: {
        type: Boolean, 
        default: false 
    },
    description: { 
        type: String 
    },
    publishYear: { 
        type: Number 
    },
    available: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, { collection: 'books' });

const bookModel = db.mongoose.model('Book', bookSchema);
module.exports = { bookModel }; 