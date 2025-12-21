const MessageService = require("../services/message.service");

class MessageController {
    // CREATE
    static async create(req,res) {
        try {
            const conversationId = Number(req.params.conversationId);
            const {content, senderId} = req.body;
            const msg = await MessageService.create({
                content, senderId: Number(senderId), 
                conversationId,
            });
            res.status(201).json(msg);
        } catch(err) {
            res.status(400).json({error: err.message});
        }
    }
    //READ: ALL
    static async getAll(req,res) {
        try {
            const conversationId = Number(req.params.conversationId);
            const msgs = await MessageService.getAllByConversation(conversationId);
            res.json(msgs);
        } catch(err) {
            res.status(500).json({error: err.message});
        }
    }
    //READ:Id
    static async getById(req,res) {
        try {
            const id = Number(req.params.messageId);
            const msg = await MessageService.getById(id);
            res.json(msg);
        }catch(err) {
            res.status(500).json({error: err.message});
        }
    }
    //UPDATE 
    static async update(req,res) {
        try{
            const id = Number(req.params.messageId);
            const msg = await MessageService.update(id,req.body);
            res.json(msg);
        }catch(err) {
            res.status(400).json({error: err.message});
        }
    }
    //DELETE
    static async remove(req,res) {
        try {
            const id = Number(req.params.messageId);
            const msg = await MessageService.delete(id);
            res.json({ message: "Đã xóa!", msg });
        } catch(err) {
            res.status(400).json({error: err.message});
        }
    }
}
module.exports = MessageController;