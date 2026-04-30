import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import schoolLogo from "../assets/images/knslogo.png";
import personOpen from "../assets/images/PERSONOPEN.png";
import personClose from "../assets/images/PERSONCLOSE.png";
import message from "../assets/images/TEXT.png";
import huleImg from "../assets/images/HULE.png";
import "../css/student_css/studentRegisterPage.css";

export default function StudentRegisterPage({ room }) {
    const [form, setForm] = useState({
        name: "",
        firstCourse: "",
        secondCourse: "",
        sex: "",
        address: "",
        dob: "",
        pob: "",
        contact: "",
        guardian: "",
        lastSchool: "",
        lastSchoolAddress: "",
        transferee: false,
        transfereeCourse: ""
    });

    const [showText, setShowText] = useState(true);
    const [isAllowed, setIsAllowed] = useState(true);

    useEffect(() => {
        document.title = `Register (${room})`;
        const checkDevice = () => {
            setIsAllowed(window.innerWidth >= 1024);
        };
        checkDevice();
        window.addEventListener("resize", checkDevice);
        return () => window.removeEventListener("resize", checkDevice);
    }, [room]);

    const availableCourses = [
        "Bachelor of Science in Computer Science",
        "Bachelor of Science in Hospitality Management",
        "Bachelor of Secondary Education major in Filipino (BSED – Filipino)",
        "Bachelor of Secondary Education major in English (BSED – English)",
        "Bachelor of Secondary Education major in Mathematics (BSED – Math)",
        "Bachelor of Secondary Education major in Social Studies (BSED – Social Studies)",
        "Bachelor of Elementary Education (BEEd)",
        "Bachelor of Science in Accountancy",
        "Bachelor of Science in Business Administration (Financial Management)",
        "Bachelor of Science in Business Administration (Human Resource Management)",
        "Bachelor of Science in Business Administration (Operations Management)"
    ];

    function handleChange(e) {
        const { name, type, value, checked } = e.target;

        if (name === "secondCourse" && value === form.firstCourse) {
            Swal.fire("Invalid Selection", "1st and 2nd Course cannot be the same!", "warning");
            return;
        }

        if (name === "firstCourse" && value === form.secondCourse) {
            Swal.fire("Invalid Selection", "1st and 2nd Course cannot be the same!", "warning");
            return;
        }

        const uppercasedFields = [
            "name",
            "address",
            "pob",
            "guardian",
            "lastSchool",
            "lastSchoolAddress",
            "transfereeCourse"
        ];

        const formattedValue = uppercasedFields.includes(name) ? value.toUpperCase() : value;

        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : formattedValue
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const API_URL = import.meta.env.VITE_API_URL;
            const res = await fetch(`${API_URL}/api/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, room })
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                Swal.fire("Error", "Server returned invalid response", "error");
                return;
            }

            if (!res.ok) {
                Swal.fire("Already Registered", data.error, "warning");
                return;
            }

            localStorage.setItem("exam_user", JSON.stringify(data.user));
            localStorage.setItem("exam_room", room);

            Swal.fire({
                title: "Registration Successful!",
                text: "Redirecting to Examination...",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = "/examination";
            });
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        }
    }

    if (!isAllowed) {
        return (
            <div className="srp-blocked">
                <div className="srp-blocked-content">
                    <img src={huleImg} alt="Blocked" className="srp-blocked-img" />

                    <h1 className="srp-blocked-title">THIS PAGE IS NOT AVAILABLE</h1>

                    <p className="srp-blocked-text">
                        Nice try. This portal isn't for phones.
                    </p>

                    <p className="srp-blocked-security">
                        MONITORED BY JPCS SECURITY SYSTEM
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="srp-page">
            <div
                className="srp-eye-click-layer"
                onClick={() => setShowText(prev => !prev)}
            ></div>

            <div className="srp-card">
                <div className="srp-header" style={{ "--watermark": `url(${schoolLogo})` }}>
                    <div className="srp-logo-wrap">
                        <img src={schoolLogo} className="srp-logo" alt="School Logo" />
                    </div>
                    <div className="srp-titles">
                        <h1 className="srp-school-name">KOLEHIYO NG SUBIC</h1>
                        <p className="srp-form-label">ENTRANCE EXAMINATION FORM</p>
                        <p className="srp-room-label">Room: {room === "avr" ? "AVR" : "Computer Laboratory 2"}</p>
                    </div>
                </div>

                <form className="srp-form" onSubmit={handleSubmit}>
                    <div className="srp-section">
                        <h2 className="srp-section-title">Personal Information</h2>
                        <div className="srp-grid srp-grid-1">
                            <div className="srp-field">
                                <label className="srp-label">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="srp-input"
                                    placeholder="Lastname, Firstname Middlename"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="srp-grid srp-grid-3">
                            <div className="srp-field">
                                <label className="srp-label">Date of Birth *</label>
                                <input
                                    type="date"
                                    name="dob"
                                    className="srp-input"
                                    value={form.dob}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="srp-field">
                                <label className="srp-label">Sex *</label>
                                <select
                                    name="sex"
                                    className="srp-input srp-select"
                                    value={form.sex}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled hidden>Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="srp-field">
                                <label className="srp-label">Contact No. *</label>
                                <input
                                    type="tel"
                                    name="contact"
                                    className="srp-input"
                                    value={form.contact}
                                    onChange={handleChange}
                                    pattern="[0-9]{10,12}"
                                    placeholder="09XXXXXXXXX"
                                    required
                                />
                            </div>
                        </div>
                        <div className="srp-grid srp-grid-2">
                            <div className="srp-field">
                                <label className="srp-label">Place of Birth</label>
                                <input
                                    type="text"
                                    name="pob"
                                    className="srp-input"
                                    value={form.pob}
                                    onChange={handleChange}
                                    placeholder="City, Province"
                                />
                            </div>
                            <div className="srp-field">
                                <label className="srp-label">Home Address *</label>
                                <input
                                    type="text"
                                    name="address"
                                    className="srp-input"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="Street, Barangay, City"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="srp-divider"></div>

                    <div className="srp-section">
                        <h2 className="srp-section-title">Course Preference</h2>
                        <div className="srp-grid srp-grid-1">
                            <div className="srp-field">
                                <label className="srp-label">1st Course Choice *</label>
                                <select
                                    name="firstCourse"
                                    className="srp-input srp-select"
                                    value={form.firstCourse}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled hidden>Select 1st Course</option>
                                    {availableCourses.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="srp-grid srp-grid-1" style={{ marginTop: "12px" }}>
                            <div className="srp-field">
                                <label className="srp-label">2nd Course Choice</label>
                                <select
                                    name="secondCourse"
                                    className="srp-input srp-select"
                                    value={form.secondCourse}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled hidden>Select 2nd Course</option>
                                    {availableCourses.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="srp-divider"></div>

                    <div className="srp-section">
                        <h2 className="srp-section-title">Educational Background</h2>
                        <div className="srp-grid srp-grid-1">
                            <div className="srp-field">
                                <label className="srp-label">Last School Attended *</label>
                                <input
                                    type="text"
                                    name="lastSchool"
                                    className="srp-input"
                                    value={form.lastSchool}
                                    onChange={handleChange}
                                    placeholder="School Name"
                                    required
                                />
                            </div>
                        </div>
                        <div className="srp-grid srp-grid-1">
                            <div className="srp-field">
                                <label className="srp-label">Address of Last School</label>
                                <input
                                    type="text"
                                    name="lastSchoolAddress"
                                    className="srp-input"
                                    value={form.lastSchoolAddress}
                                    onChange={handleChange}
                                    placeholder="Street, Barangay, City"
                                />
                            </div>
                        </div>
                        <div className="srp-check-wrap" onClick={() => setForm({ ...form, transferee: !form.transferee })}>
                            <input
                                type="checkbox"
                                id="srp-transferee"
                                name="transferee"
                                className="srp-checkbox"
                                checked={form.transferee}
                                onChange={handleChange}
                            />
                            <label htmlFor="srp-transferee" className="srp-check-label">I am a Transferee</label>
                        </div>
                        {form.transferee && (
                            <div className="srp-grid srp-grid-1 srp-fade-in">
                                <div className="srp-field">
                                    <label className="srp-label">Previous Course Taken *</label>
                                    <input
                                        type="text"
                                        name="transfereeCourse"
                                        className="srp-input"
                                        value={form.transfereeCourse}
                                        onChange={handleChange}
                                        placeholder="Course Name"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="srp-divider"></div>

                    <div className="srp-section">
                        <h2 className="srp-section-title">Guardian / Parent Information</h2>
                        <div className="srp-grid srp-grid-1">
                            <div className="srp-field">
                                <label className="srp-label">Guardian / Parent Full Name *</label>
                                <input
                                    type="text"
                                    name="guardian"
                                    className="srp-input"
                                    value={form.guardian}
                                    onChange={handleChange}
                                    placeholder="Lastname, Firstname"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="srp-submit-btn">Start Examination</button>
                </form>
            </div>

            <div className="srp-eye-wrap">
                <img src={personOpen} className="srp-eye-img open" />
                <img src={personClose} className="srp-eye-img close" />
            </div>
            {showText && (
                <img src={message} className="srp-eye-msg" />
            )}

            <footer className="srp-twitter-footer">
                <div className="srp-footer-content">
                    <p className="srp-footer-org">Powered by: Junior Philippine Computer Society</p>
                    <p className="srp-footer-credit">Created by Jayvee Madriaga Nacino | JPCS President</p>
                    <p className="srp-footer-credit">All Rights Reserved @ 2026</p>
                </div>
            </footer>
        </div>
    );
}