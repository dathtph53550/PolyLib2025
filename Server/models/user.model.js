const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const userSchema = new db.mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  role: { type: Number, enum: [0, 1, 2], default: 0 },
  status: { type: Number, enum: [0, 1], default: 1 },
  token: { type: String }
}, { collection: 'users', timestamps: true });

// Tạo token
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign(
    { _id: user._id, username: user.username, role: user.role },
    process.env.TOKEN_SEC_KEY
  );
  user.token = token;
  await user.save();
  return token;
};

// Tìm user theo thông tin đăng nhập
userSchema.statics.findByCredentials = async (username, password) => {
  const user = await userModel.findOne({ username, status: 1 });
  if (!user) throw new Error('Không tồn tại người dùng hoặc tài khoản đã bị khóa');
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Sai mật khẩu');
  
  return user;
};

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

// Không trả về password và token trong JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.token;
  return user;
};

const userModel = db.mongoose.model('User', userSchema);
module.exports = { userModel };