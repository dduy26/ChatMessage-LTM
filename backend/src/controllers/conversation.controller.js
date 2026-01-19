const ConversationService = require("../services/conversation.service");

class ConversationController {
    // CREATE
    static async create(req,res) {
        try {
            const convo = await ConversationService.create(req.body);
            res.status(201).json(convo);
        } catch(err) {
            res.status(400).json({error: err.message});
        }
    }

    // READ: ALL 
    static async getAll(req,res) {
        try {
            const userId = req.user?.userId || req.user?.id;
            const convos = await ConversationService.getAll(userId);
            res.json(convos);
        } catch(err) {
            res.status(500).json({error: err.message});
        }
    } 
    //READ: Id 
    static async getById(req,res) {
        try {
            const id = Number(req.params.id);
            const convo = await ConversationService.getById(id);
            if (!convo) return res.status(404).json({ error: "Không tìm thấy!" });
        }catch(err) {
            res.status(400).json({ error: err.message });
        }
    }
    // UPDATE 
    static async update(req,res) {
        try {
            const id = Number(req.params.id);
            const convo = await ConversationService.update(id, req.body);
            res.json(convo);
        } catch(err) {
            res.status(400).json({ error: err.message });
        }
    }
    // DELETE 
    static async remove(req,res) {
        try {
            const id = Number(req.params.id);
            const convo = await ConversationService.delete(id);
            res.json({ message: "Đã xóa!", convo });
        } catch(err) {
            res.status(400).json({error: err.message});
        }
    }
}

module.exports = ConversationController;