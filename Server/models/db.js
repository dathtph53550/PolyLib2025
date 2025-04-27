const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://dathtph53550:fgBZBFtyJZ4teJtS@hoangdat.hwvdf.mongodb.net/PolyLib2025', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).catch(err => {
  console.log("Lỗi kết nối CSDL:", err);
});

module.exports = { mongoose };