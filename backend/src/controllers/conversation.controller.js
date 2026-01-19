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

    // CREATE GROUP
    static async createGroup(req, res) {
        try {
            const ownerId = req.user?.userId || req.user?.id;
            const { title, memberIds } = req.body;

            if (!title) {
                return res.status(400).json({ error: "Vui lòng nhập tên nhóm" });
            }
            if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
                return res.status(400).json({ error: "Vui lòng chọn thành viên cho nhóm" });
            }

            const group = await ConversationService.createGroup({
                title,
                memberIds,
                ownerId: Number(ownerId)
            });

            return res.status(201).json(group);
        } catch (error) {
            console.error("Lỗi tạo nhóm:", error);
            return res.status(400).json({ error: error.message || "Không thể tạo nhóm" });
        }
    }

    // READ: ALL 
    static async getAll(req,res) {
        try {
            const userId = req.user?.userId || req.user?.id;
            const convos = await ConversationService.getAll(Number(userId));
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