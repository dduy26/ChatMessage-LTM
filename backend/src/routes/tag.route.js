const router = require('express').Router();
const TagController = require('../controllers/tag.controller');

// CRUD Danh mục Tag
router.post('/create', TagController.createTag);
router.get('/all', TagController.getAll);
router.put('/:id', TagController.updateTag);
router.delete('/:id', TagController.deleteTag);

// Gắn/Gỡ Tag cho User (Test bằng Body JSON)
router.post('/assign', TagController.assignTag);
router.post('/remove', TagController.removeTag); 

module.exports = router;