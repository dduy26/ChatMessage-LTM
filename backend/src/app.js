const express = require('express');
const cors = require('cors');
const socket = require('socket.io')
const cookieParser = require('cookie-parser');
const path = require('path');
require("dotenv").config();
const fs = require('fs');
const uploadDir = path.join(__dirname, '../../uploads');
const absoluteUploadPath = path.resolve(__dirname, '..', '..', 'uploads');

const app = express();

// 1. Middlewares
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());


// 2. Routes 
app.use('/api/health', require('./routes/health.route'));
app.use('/api/auth', require('./routes/auth.route')); 
app.use("/api/users", require("./routes/user.route"));
app.use("/api/conversations", require("./routes/conversation.route"));
app.use("/api/messages", require("./routes/message.route"));
app.use("/api/participants", require("./routes/participant.route"));
app.use("/api/devices", require("./routes/device.route"));
app.use("/api/notifications", require("./routes/notification.route"));
app.use("/api/tasks", require("./routes/task.route"));
app.use("/api/attachments", require("./routes/attachment.route"));
app.use("/api/deleted-messages", require("./routes/deletedMessage.route"));
app.use("/api/blocklist", require("./routes/blocklist.route"));
app.use("/api/reports", require("./routes/report.route"));
app.use("/api/reactions", require("./routes/reaction.route"));
app.use("/api/conversation-tags", require("./routes/conversationTag.route"));
app.use("/api/tags", require("./routes/tag.route"));
app.use("/api/friendships", require("./routes/friendship.route"));
app.use("/api/pinned", require("./routes/pinned.route"));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Server is running" });
});

module.exports = app;