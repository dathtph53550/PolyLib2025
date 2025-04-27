const auth = require('./auth');

// Middleware kiểm tra quyền admin (role = 2)
const adminAuth = async (req, res, next) => {
    try {
        await auth(req, res, () => {
            if (req.user.role !== 2) {
                throw new Error('Không có quyền truy cập. Yêu cầu quyền admin.');
            }
            next();
        });
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

module.exports = adminAuth; 