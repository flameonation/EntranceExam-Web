const express = require("express");
const router = express.Router();
const Result = require("../models/Result");
const Question = require("../models/Question");

router.get("/all-results", async (req, res) => {
    try {
        const results = await Result.find()
            .populate("userId")
            .sort({ submittedAt: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch results" });
    }
});

router.get("/questions", async (req, res) => {
    try {
        const questions = await Question.find().populate("subjectId");
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch questions" });
    }
});

router.put("/results/:id", async (req, res) => {
    try {
        const { score, subjectScores } = req.body;
        const updated = await Result.findByIdAndUpdate(
            req.params.id,
            { $set: { score, subjectScores } },
            { new: true, runValidators: true }
        ).populate("userId");
        if (!updated) {
            return res.status(404).json({ message: "Result not found" });
        }
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Failed to update result" });
    }
});

router.delete("/results/:id", async (req, res) => {
    try {
        const deleted = await Result.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Result not found" });
        }
        res.json({ message: "Result deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete result" });
    }
});

router.post("/results/create", async (req, res) => {
    try {
        const { userId, answers, score, totalQuestions, subjectScores } = req.body;
        const newResult = new Result({
            userId,
            answers: answers || [],
            score,
            totalQuestions,
            subjectScores,
        });
        await newResult.save();
        res.status(201).json({ message: "Result saved", result: newResult });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;