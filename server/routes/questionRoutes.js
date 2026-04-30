const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const Subject = require("../models/Subject");
const Result = require("../models/Result");

router.get("/subjects", async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ createdAt: 1 });
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/subjects", async (req, res) => {
    try {
        const newSubject = new Subject({ name: req.body.name });
        const saved = await newSubject.save();
        res.json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete("/subjects/:id", async (req, res) => {
    try {
        const subjectId = req.params.id;
        await Question.deleteMany({ subjectId });
        await Subject.findByIdAndDelete(subjectId);
        res.json({ message: "Subject and all its questions deleted" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete subject" });
    }
});

router.get("/all-questions", async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ createdAt: 1 });
        const subjectOrder = subjects.map(s => s._id.toString());

        const questions = await Question.find().populate("subjectId").sort({ order: 1, createdAt: 1 });

        const grouped = {};
        questions.forEach(q => {
            const sid = q.subjectId?._id?.toString();
            if (!grouped[sid]) grouped[sid] = [];
            grouped[sid].push(q);
        });

        const ordered = [];
        subjectOrder.forEach(sid => {
            if (grouped[sid]) ordered.push(...grouped[sid]);
        });

        Object.keys(grouped).forEach(sid => {
            if (!subjectOrder.includes(sid)) ordered.push(...grouped[sid]);
        });

        res.json(ordered);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/questions/:subjectId", async (req, res) => {
    try {
        const questions = await Question.find({ subjectId: req.params.subjectId }).sort({ order: 1, createdAt: 1 });
        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/questions", async (req, res) => {
    try {
        const { subjectId, text, options, correct } = req.body;

        if (!subjectId || !text || !options || !correct) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const sanitizedCorrect = correct.trim().toUpperCase();
        if (!["A", "B", "C", "D"].includes(sanitizedCorrect)) {
            return res.status(400).json({ error: "correct must be A, B, C, or D" });
        }

        const lastQuestion = await Question.findOne({ subjectId }).sort({ order: -1 });
        const nextOrder = lastQuestion ? lastQuestion.order + 1 : 0;

        const newQuestion = new Question({
            subjectId,
            text: text.trim(),
            options: {
                A: options.A.trim(),
                B: options.B.trim(),
                C: options.C.trim(),
                D: options.D.trim(),
            },
            correct: sanitizedCorrect,
            order: nextOrder,
        });

        const saved = await newQuestion.save();
        res.json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put("/questions/:id", async (req, res) => {
    try {
        const { subjectId, text, options, correct } = req.body;

        const sanitizedCorrect = correct.trim().toUpperCase();
        if (!["A", "B", "C", "D"].includes(sanitizedCorrect)) {
            return res.status(400).json({ error: "correct must be A, B, C, or D" });
        }

        const updated = await Question.findByIdAndUpdate(
            req.params.id,
            {
                subjectId,
                text: text.trim(),
                options: {
                    A: options.A.trim(),
                    B: options.B.trim(),
                    C: options.C.trim(),
                    D: options.D.trim(),
                },
                correct: sanitizedCorrect,
            },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put("/questions/reorder", async (req, res) => {
    try {
        const { orderedIds } = req.body;
        const updates = orderedIds.map((id, index) =>
            Question.findByIdAndUpdate(id, { order: index })
        );
        await Promise.all(updates);
        res.json({ message: "Order updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/questions/:id", async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/exam/submit", async (req, res) => {
    try {
        const { userId, answers } = req.body;

        if (!userId || !answers) {
            return res.status(400).json({ success: false, message: "Missing User ID or Answers" });
        }

        const allQuestions = await Question.find().populate("subjectId");

        const subjectMap = {};
        allQuestions.forEach(q => {
            const subjectName = q.subjectId?.name || "General";
            if (!subjectMap[subjectName]) subjectMap[subjectName] = { qIds: [], total: 0 };
            subjectMap[subjectName].qIds.push(q._id.toString());
            subjectMap[subjectName].total++;
        });

        let score = 0;

        const processedAnswers = allQuestions.map((q) => {
            const qIdString = q._id.toString();
            const studentChoice = (answers[qIdString] || "").trim().toUpperCase();
            const correctAnswer = (q.correct || "").trim().toUpperCase();
            const isCorrect = studentChoice !== "" && correctAnswer === studentChoice;
            if (isCorrect) score++;
            return {
                questionId: q._id,
                selectedOption: studentChoice || "N/A",
                isCorrect: isCorrect
            };
        });

        const answerMap = {};
        processedAnswers.forEach(a => {
            answerMap[a.questionId.toString()] = a.isCorrect;
        });

        const subjectScores = Object.entries(subjectMap).map(([subject, { qIds, total }]) => {
            const correct = qIds.filter(id => answerMap[id] === true).length;
            return { subject, score: correct, total };
        });

        const finalResult = new Result({
            userId,
            answers: processedAnswers,
            score,
            totalQuestions: allQuestions.length,
            subjectScores
        });

        await finalResult.save();

        res.status(200).json({
            success: true,
            message: "Exam submitted successfully",
            score,
            total: allQuestions.length
        });

    } catch (err) {
        console.error("Submission Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;