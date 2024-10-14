const express = require('express');
const { createAccount, updateAccount, deleteAccount, fetchUsers, fetchUsersWithAccess, grantAccess, revokeAccess } = require('../controllers/account');
const { verifyAccessToken } = require('../auth');
const router = express.Router();

router.post('/users', createAccount);
router.put('/users/:userId', verifyAccessToken, updateAccount);
router.delete('/users/:userId', verifyAccessToken, deleteAccount);
router.get('/users/:userId', verifyAccessToken, fetchUsers);
router.get('/users/:userId/notes/:noteId', verifyAccessToken, fetchUsersWithAccess);
router.put('/users/:userId/notes/:noteId/grant/:access', verifyAccessToken, grantAccess);
router.put('/users/:userId/notes/:noteId/revoke/:access', verifyAccessToken, revokeAccess);

module.exports = router;