const express = require('express');
const app = express();
const userRouter = require('./routes/api');
const bookRouter = require('./routes/books');
require('./models/db'); // Kết nối MongoDB

app.use(express.json()); // Parse JSON body
app.use('/api/users', userRouter); // Gắn router API
app.use('/api/books', bookRouter); // Gắn router API

// Render sẽ cấp PORT động
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại cổng ${PORT}`);
});
