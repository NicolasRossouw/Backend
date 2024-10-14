const express = require('express');
const { createNote, updateNote, deleteNote, fetchNotes, fetchNote} = require('../controllers/notes');
const { verifyAccessToken } = require('../auth');
const router = express.Router();

router.post('/notes', verifyAccessToken, createNote);
router.put('/notes/:noteId', verifyAccessToken, updateNote);
router.delete('/notes/:noteId', verifyAccessToken, deleteNote);
router.get('/notes/users/:userId', verifyAccessToken, fetchNotes);
router.get('/notes/:noteId', verifyAccessToken, fetchNote);

module.exports = router;