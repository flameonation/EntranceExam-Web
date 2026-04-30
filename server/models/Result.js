const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    answers: [
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
            selectedOption: { type: String, required: true },
            isCorrect: { type: Boolean }
        }
    ],
    score: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    subjectScores: [
        {
            subject: { type: String },
            score: { type: Number },
            total: { type: Number }
        }
    ],
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Result", ResultSchema);