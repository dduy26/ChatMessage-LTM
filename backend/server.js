require('dotenv').config();
const app = require('./src/app');
const http = require('http'); 
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"],
        credentials: true 
    }
});

io.on('connection', (socket) => {
    console.log(` User connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(' User disconnected');
    });
});

// Lắng nghe lỗi server để tránh crash
server.on('error', (error) => {
    console.error(' Server Error:', error.message);
});

server.listen(PORT, () => {
    console.log(` Backend running at http://localhost:${PORT}`);
});