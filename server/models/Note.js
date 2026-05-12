const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    examinerId: { type: String, required: true },
    examinerName: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);