const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/register", async (req, res) => {
    try {
        console.log("INCOMING BODY:", req.body);

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
            room: req.body.room,
        });

        await newUser.save();
        console.log("SAVED USER:", newUser);
        res.status(201).json({ message: "Success", user: newUser });
    } catch (err) {
        console.log("SAVE ERROR:", err.message);
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
            { room: { $in: ['avr', 'comlab-2'] } },
            { room: 1, sex: 1, transferee: 1, _id: 0 }
        ).sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;