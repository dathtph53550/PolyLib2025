const db = require('./db');

const categorySchema = new db.mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    image :{
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'categories' });

const categoryModel = db.mongoose.model('Category', categorySchema);
module.exports = { categoryModel }; 