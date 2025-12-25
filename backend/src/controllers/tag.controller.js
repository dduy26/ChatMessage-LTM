    const TagService = require("../services/tag.service");

    class TagController {
    static async assignTag(req, res) {
        try{
            const userId = req.user.id;
            const { tagId } = req.body;
            const result = await TagService.assignTag(parseInt(userId), tagId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async removeTag(req, res) {
        try{
            const userId = req.user.id;
            const { tagId } = req.body;
            const result = await TagService.removeTag(parseInt(userId), tagId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async createTag(req,res){
        try{
            const data = req.body;
            const result = await TagService.createTag(data);
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async getAll(req,res){
        try{
            const result = await TagService.getAll();
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
module.exports = TagController;