const router = require('express').Router();
const TagController = require('../controllers/tag.controller');

router.post('/create', TagController.createTag);
router.get('/all', TagController.getAll);
router.post('/assign', TagController.assignTag);
router.delete('/remove/:tagId', TagController.removeTag);


module.exports = router;