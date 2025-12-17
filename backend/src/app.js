const express = require('express');
const cors = require('cors');

const healthRoute = require('./routes/health.route');

const app = express(); // ⬅️ BẮT BUỘC

app.use(cors({
    origin: 'http://localhost:5173'
}));
app.use(express.json());

app.use('/api/health', healthRoute);

module.exports = app;
