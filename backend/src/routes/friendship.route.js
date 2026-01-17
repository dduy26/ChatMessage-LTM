const router = require('express').Router();
const FriendshipController = require('../controllers/friendship.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/requests', FriendshipController.getPendingRequests);
router.post('/send-request', FriendshipController.sendRequest);
router.put('/accept/:id', FriendshipController.acceptRequest);
router.delete('/:id', FriendshipController.removeFriend);
router.get('/friends', FriendshipController.getFriends);
module.exports = router;