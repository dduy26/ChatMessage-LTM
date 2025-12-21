const express = require('express');
const cors = require('cors');

const healthRoute = require('./routes/health.route');

const authRoute = require('./routes/auth.route');
const app = express(); // ⬅️ BẮT BUỘC


app.use(cors({
    origin: 'http://localhost:5173'
}));
app.use(express.json());

app.use('/api/health', healthRoute);
app.use('/api/auth', authRoute);
app.use("/api/users", require("./routes/user.route"));
app.use("/api/conversations", require("./routes/conversation.route"));
app.use("/api/conversations", require("./routes/message.route"));



app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});

module.exports = app;
