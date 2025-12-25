const router = require('express').Router();
const FriendshipController = require('../controllers/friendship.controller');

router.post('/request', FriendshipController.sendRequest);
router.post('/accept/:id', FriendshipController.acceptRequest);
router.delete('/:id', FriendshipController.removeFriend);
router.get('/friends', FriendshipController.getFriends);

module.exports = router;