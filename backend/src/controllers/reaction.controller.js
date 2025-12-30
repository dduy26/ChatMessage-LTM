const ReactionService = require("../services/reaction.service");

class ReactionController {
    static async toggle(req, res) {
        try {
            const { messageId } = req.params;
            const { participantId, emoji } = req.body;
            
            if (!emoji) return res.status(400).json({ error: "Thiếu emoji" });

            const result = await ReactionService.toggleReaction(messageId, participantId, emoji);
            res.json({ message: "Xử lý cảm xúc thành công", data: result });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async getByMessage(req, res) {
        try {
            const { messageId } = req.params;
            const reactions = await ReactionService.getByMessage(messageId);
            res.json(reactions);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = ReactionController;