const auth = require('./auth');

// Middleware kiểm tra quyền nhân viên (role >= 1)
const staffAuth = async (req, res, next) => {
    try {
        await auth(req, res, () => {
            if (req.user.role < 1) {
                throw new Error('Không có quyền truy cập. Yêu cầu quyền nhân viên.');
            }
            next();
        });
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

module.exports = staffAuth; 