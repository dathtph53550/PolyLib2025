const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const auth = require('../middleware/auth');

// Routes cho books (tất cả đều yêu cầu xác thực)
router.get('/', auth, bookController.getAllBooks);
router.get('/:id', auth, bookController.getBook);
router.post('/', auth, bookController.createBook);
router.put('/:id', auth, bookController.updateBook);
router.delete('/:id', auth, bookController.deleteBook);

module.exports = router; 