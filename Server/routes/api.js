const express = require('express');
const router = express.Router();

// Import controllers
const userController = require('../controllers/userController');
const bookController = require('../controllers/bookController');
const categoryController = require('../controllers/categoryController');
const borrowTicketController = require('../controllers/borrowTicketController');
const returnTicketController = require('../controllers/returnTicketController');
const notificationController = require('../controllers/notificationController');
const registrationController = require('../controllers/registrationController');

// Import middlewares
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const staffAuth = require('../middleware/staffAuth');

// === USER ROUTES ===
// Routes không cần xác thực
router.post('/register', userController.register);
router.post('/login', userController.login);

// Routes cần xác thực
router.post('/logout', auth, userController.logout);
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

// Routes cho Admin
router.get('/users', adminAuth, userController.getAllUsers);
router.get('/users/:id', adminAuth, userController.getUser);
router.put('/users/:id', adminAuth, userController.updateUser);
router.delete('/users/:id', adminAuth, userController.deleteUser);
router.put('/users/:id/toggle-status', adminAuth, userController.toggleUserStatus);

// === CATEGORY ROUTES ===
router.get('/categories', auth, categoryController.getAllCategories);
router.get('/categories/:id', auth, categoryController.getCategory);
router.post('/categories', adminAuth, categoryController.createCategory);
router.put('/categories/:id', adminAuth, categoryController.updateCategory);
router.delete('/categories/:id', adminAuth, categoryController.deleteCategory);

// === BOOK ROUTES ===
router.get('/books', auth, bookController.getAllBooks);
router.get('/books/:id', auth, bookController.getBook);
router.post('/books', adminAuth, bookController.createBook);
router.put('/books/:id', adminAuth, bookController.updateBook);
router.delete('/books/:id', adminAuth, bookController.deleteBook);
router.put('/books/:id/quantity', adminAuth, bookController.updateQuantity);

// === REGISTRATION ROUTES ===
router.get('/registrations', auth, registrationController.getAllRegistrations);
router.get('/registrations/:id', auth, registrationController.getRegistration);
router.post('/registrations', auth, registrationController.createRegistration);
router.put('/registrations/:id/process', staffAuth, registrationController.processRegistration);
router.put('/registrations/:id/cancel', auth, registrationController.cancelRegistration);

// === BORROW TICKET ROUTES ===
router.get('/borrow-tickets', auth, borrowTicketController.getAllBorrowTickets);
router.get('/borrow-tickets/:id', auth, borrowTicketController.getBorrowTicket);
router.post('/borrow-tickets', auth, borrowTicketController.createBorrowTicket);
router.put('/borrow-tickets/:id/process', staffAuth, borrowTicketController.processBorrowTicket);

// === RETURN TICKET ROUTES ===
router.get('/return-tickets', staffAuth, returnTicketController.getAllReturnTickets);
router.get('/return-tickets/:id', auth, returnTicketController.getReturnTicket);
router.post('/return-tickets', staffAuth, returnTicketController.createReturnTicket);
router.put('/return-tickets/:id/fine', staffAuth, returnTicketController.updateFinePayment);

// === NOTIFICATION ROUTES ===
router.get('/notifications', auth, notificationController.getMyNotifications);
router.put('/notifications/:id/read', auth, notificationController.markAsRead);
router.put('/notifications/read-all', auth, notificationController.markAllAsRead);
router.delete('/notifications/:id', auth, notificationController.deleteNotification);
router.delete('/notifications/read', auth, notificationController.deleteAllRead);
router.post('/notifications/bulk', adminAuth, notificationController.createBulkNotifications);

module.exports = router;