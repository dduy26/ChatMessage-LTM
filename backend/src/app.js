const express = require('express');
const cors = require('cors');

const healthRoute = require('./routes/health.route');

const authRoute = require('./routes/auth.route');
const friendshipRoutes = require('./routes/friendship.route');
const tagRoutes = require('./routes/tag.route');
const app = express(); // ⬅️ BẮT BUỘC


app.use(cors({
    origin: 'http://localhost:5173'
}));
app.use(express.json());

app.use('/api/health', healthRoute);
app.use('/api/auth', authRoute);
app.use('/api/friendships', friendshipRoutes);
app.use('/api/tags', tagRoutes);

module.exports = app;
