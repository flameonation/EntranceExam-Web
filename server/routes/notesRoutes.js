const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

router.get('/', async (req, res) => {
    try {
        const notes = await Note.find().sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { examinerId, examinerName, text, date } = req.body;
        if (!examinerId || !examinerName || !text || !date) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const note = new Note({ examinerId, examinerName, text, date });
        await note.save();
        res.status(201).json(note);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await Note.findByIdAndDelete(req.params.id);
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;