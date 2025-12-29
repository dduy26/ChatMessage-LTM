const express = require('express');
const cors = require('cors');
require("dotenv").config();

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

const AuthRoutes = require("./routes/auth.route");
app.use("/api/auth", AuthRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});

module.exports = app;
