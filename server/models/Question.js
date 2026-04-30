const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    options: {
        A: { type: String, required: true },
        B: { type: String, required: true },
        C: { type: String, required: true },
        D: { type: String, required: true },
    },
    correct: {
        type: String,
        enum: ["A", "B", "C", "D"],
        required: true,
    },
    order: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model("Question", QuestionSchema);