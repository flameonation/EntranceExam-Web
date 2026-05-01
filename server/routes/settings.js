const express = require('express');
const router = express.Router();

let lockState = { boardPasserLocked: false };

router.get('/boardpasser-lock', (req, res) => {
    res.json({ locked: lockState.boardPasserLocked });
});

router.post('/boardpasser-lock', (req, res) => {
    const { locked } = req.body;
    if (typeof locked !== 'boolean') {
        return res.status(400).json({ error: 'locked must be a boolean' });
    }
    lockState.boardPasserLocked = locked;
    res.json({ locked: lockState.boardPasserLocked });
});

module.exports = router;