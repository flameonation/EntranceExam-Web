const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, uppercase: true },
    registerNumber: { type: String, required: true, unique: true },
    firstCourse: { type: String, required: true },
    secondCourse: { type: String },
    sex: { type: String, required: true },
    address: { type: String, required: true, uppercase: true },
    dob: { type: String, required: true },
    pob: { type: String, uppercase: true },
    contact: { type: String, required: true },
    guardian: { type: String, required: true, uppercase: true },
    lastSchool: { type: String, required: true, uppercase: true },
    lastSchoolAddress: { type: String, uppercase: true },
    transferee: { type: Boolean, default: false },
    transfereeCourse: { type: String, uppercase: true },
    room: { type: String, enum: ["avr", "comlab-2"], default: "avr" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);