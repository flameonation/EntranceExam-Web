const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/register", async (req, res) => {
    try {
        const existingUser = await User.findOne({ name: req.body.name, dob: req.body.dob });
        if (existingUser) {
            return res.status(400).json({ error: "User already registered with this name and birthdate." });
        }

        const newUser = new User({
            name: req.body.name,
            firstCourse: req.body.firstCourse,
            secondCourse: req.body.secondCourse,
            sex: req.body.sex,
            address: req.body.address,
            dob: req.body.dob,
            pob: req.body.pob,
            contact: req.body.contact,
            guardian: req.body.guardian,
            lastSchool: req.body.lastSchool,
            lastSchoolAddress: req.body.lastSchoolAddress,
            transferee: req.body.transferee,
            transfereeCourse: req.body.transfereeCourse,
            registerNumber: req.body.registerNumber,
        });

        await newUser.save();
        res.status(201).json({ message: "Success", user: newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/rooms", async (req, res) => {
    try {
        const users = await User.find(
            { room: { $in: ["avr", "comlab-2"] } },
            { room: 1, sex: 1, transferee: 1, _id: 0 }
        ).sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const {
            name, registerNumber, dob, sex, contact, pob, address,
            firstCourse, secondCourse,
            lastSchool, lastSchoolAddress,
            transferee, transfereeCourse,
            guardian, room,
        } = req.body;

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name, registerNumber, dob, sex, contact, pob, address,
                    firstCourse, secondCourse,
                    lastSchool, lastSchoolAddress,
                    transferee, transfereeCourse,
                    guardian, room,
                },
            },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Updated", user: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const deleted = await User.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: "User not found" });
        }

        const Result = require("../models/Result");
        await Result.deleteMany({ userId: req.params.id });

        res.json({ message: "User and associated results deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;