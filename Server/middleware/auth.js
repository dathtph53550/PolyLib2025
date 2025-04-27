const jwt = require('jsonwebtoken');
const { userModel } = require('../models/user.model');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('Yêu cầu xác thực');
    }
    const decoded = jwt.verify(token, 'JBASDH958VVHA34JSDJBF'); 
    const user = await userModel.findOne({ _id: decoded._id, token });
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Vui lòng xác thực' });
  }
};

module.exports = auth;