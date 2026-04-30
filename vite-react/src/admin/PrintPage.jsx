import React, { useEffect, useState } from "react";
import axios from "axios";
import "./admincss/results.css";
import logo from "../assets/images/knslogo.png";

export default function StudentPrint({ student, result, onReady }) {
    const [subjects, setSubjects] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchData = async () => {
            if (!student?._id) return;

            try {
                const [subRes, qRes] = await Promise.allSettled([
                    axios.get(`${API_URL}/api/subjects`),
                    axios.get(`${API_URL}/api/questions`)
                ]);

                if (subRes.status === "fulfilled") setSubjects(subRes.value.data);
                if (qRes.status === "fulfilled") setQuestions(qRes.value.data);

                setIsLoaded(true);
            } catch (err) {
                console.error("Data fetch error", err);
                setIsLoaded(true);
            }
        };

        fetchData();
    }, [student, API_URL]);

    useEffect(() => {
        if (isLoaded && onReady) {
            const timer = setTimeout(() => {
                onReady();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, onReady]);

    if (!student || !isLoaded) return null;

    const formattedDate = new Date(student.registrationDate || student.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    }).toUpperCase();

    // FIXED: This function now checks for edited scores in result.subjectScores first
    const getSubjectScore = (subjectName, subjectId) => {
        // 1. Check if we have manually edited subjectScores from the DB
        if (result?.subjectScores && result.subjectScores.length > 0) {
            const editedData = result.subjectScores.find(
                (s) => s.subject.toLowerCase() === subjectName.toLowerCase()
            );
            if (editedData) return editedData.score;
        }

        // 2. Fallback to manual calculation if no edited data exists
        if (!result?.answers || !questions.length) return 0;

        const subjectQuestions = questions.filter(q =>
            (q.subjectId?._id || q.subjectId) === subjectId
        );

        const subjectQuestionIds = subjectQuestions.map(q => q._id);

        const correctAnswers = result.answers.filter(a =>
            subjectQuestionIds.includes(a.questionId) && a.isCorrect === true
        );

        return correctAnswers.length;
    };

    const printScore = result?.score ?? 0;

    return (
        <div id="print-area" style={{ marginTop: "30px" }}>
            <img
                src={logo}
                alt="Kolehiyo ng Subic Logo"
                style={{ width: "80px", height: "auto", position: "absolute", marginLeft: "210px", }}
            />

            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "20px" }}>
                KOLEHIYO NG SUBIC
            </div>

            <div style={{ textAlign: "center" }}>
                Subic, Zambales
            </div>

            <h3 style={{ textAlign: "center", marginTop: "10px" }}>
                REGISTRATION FORM
            </h3>

            <hr style={{ paddingBottom: "20px" }} />

            <div className="kns-print-container" style={{ marginTop: "4px", marginBottom: "15px", padding: "15px", fontSize: "13px" }}>

                <div className="kns-info-row">
                    <span className="kns-info-label">
                        DATE: <span style={{ fontWeight: "bold" }}>{formattedDate}</span>
                    </span>
                </div>

                <div className="kns-info-row" style={{ marginTop: "12px", marginBottom: "8px" }}>
                    <span className="kns-info-label">
                        Name: <span style={{ fontWeight: "bold" }}>{student.name}</span>
                    </span>
                    <span className="kns-info-label" style={{ marginLeft: "220px" }}>
                        SEX: <span style={{ fontWeight: "bold" }}>{student.sex}</span>
                    </span>
                </div>

                <div className="kns-info-row" style={{ marginBottom: "8px" }}>
                    <span className="kns-info-label">
                        Address: <span style={{ fontWeight: "bold" }}>{student.address}</span>
                    </span>
                </div>

                <div className="kns-info-row" style={{ marginBottom: "8px" }}>
                    <span className="kns-info-label">
                        Date of Birth: <span style={{ fontWeight: "bold" }}>{student.dob}</span>
                    </span>
                    <span className="kns-info-label" style={{ marginLeft: "190px" }}>
                        Place of Birth: <span style={{ fontWeight: "bold" }}>{student.pob}</span>
                    </span>
                </div>

                <div className="kns-info-row" style={{ marginBottom: "8px" }}>
                    <span className="kns-info-label">
                        Contact Number: <span style={{ fontWeight: "bold" }}>{student.contact}</span>
                    </span>
                    <span className="kns-info-label" style={{ marginLeft: "150px" }}>
                        Name of Guardian: <span style={{ fontWeight: "bold" }}>{student.guardian}</span>
                    </span>
                </div>

                <div className="kns-info-row" style={{ marginBottom: "8px" }}>
                    <span className="kns-info-label">
                        School Last Attended: <span style={{ fontWeight: "bold" }}>{student.lastSchool}</span>
                    </span>
                </div>

                <div className="kns-info-row" style={{ marginBottom: "8px" }}>
                    <span className="kns-info-label">
                        Address of School Last Attended: <span style={{ fontWeight: "bold" }}>{student.lastSchoolAddress}</span>
                    </span>
                </div>

                <div className="kns-info-row" style={{ marginBottom: "8px" }}>
                    <span className="kns-info-label">
                        Course Taken (for transferees only): <span style={{ fontWeight: "bold" }}>{student.transfereeCourse || "N/A"}</span>
                    </span>
                </div>

                <div style={{ marginTop: "20px", marginBottom: "15px" }}>
                    <span style={{ fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                        COURSE TO BE TAKEN IN THIS INSTITUTION:
                    </span>

                    <div style={{ display: "flex", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "bold", width: "200px" }}>FIRST CHOICE:</span>
                        <span style={{ minWidth: "400px" }}>{student.firstCourse}</span>
                    </div>

                    <div style={{ display: "flex" }}>
                        <span style={{ fontWeight: "bold", width: "200px" }}>SECOND CHOICE:</span>
                        <span style={{ minWidth: "400px" }}>{student.secondCourse}</span>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginTop: "20px", fontWeight: "bold", borderTop: "2px solid black", borderLeft: "2px solid black", fontSize: "11px" }}>
                    <div style={{ textAlign: "center", borderBottom: "2px solid black", borderRight: "2px solid black", padding: "8px" }}>INCOMING FIRST YEAR</div>
                    <div style={{ textAlign: "center", borderBottom: "2px solid black", borderRight: "2px solid black", padding: "8px" }}>FOR TRANSFEREE</div>

                    <div style={{ borderBottom: "2px solid black", borderRight: "2px solid black", padding: "8px" }}>
                        ( ) High School Card/Form 138<br />
                        ( ) Certificate of Good Moral Character<br />
                        ( ) Barangay Certificate of Residency<br />
                        ( ) Two (2) 2X2 Colored Pictures<br />
                        ( ) PSA Certified Birth Certificate<br />
                        ( ) Two (2) 2X2 Long Brown Envelopes
                    </div>

                    <div style={{ borderBottom: "2px solid black", borderRight: "2px solid black", padding: "8px" }}>
                        ( ) Transcript of record/Grades<br />
                        ( ) Honorable Dismissal<br />
                        ( ) Barangay Certificate of Residency<br />
                        ( ) Two (2) 2X2 Colored Pictures<br />
                        ( ) PSA Certified Birth Certificate<br />
                        ( ) Two (2) 2X2 Long Brown Envelopes
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "50px" }}>
                    <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "12px", width: "200px" }}>
                        <span style={{ textDecoration: "underline" }}>Ms. Thelma Laxamana</span>
                        <br />
                        Registrar
                    </div>
                </div>

                <hr />

                <div className="kns-info-row" style={{ display: "flex", justifyContent: "flex-end", paddingTop: "20px", width: "100%" }}>
                    <span className="kns-info-label">
                        DATE: <span style={{ fontWeight: "bold" }}>{formattedDate}</span>
                    </span>
                </div>

                <div className="kns-exam-grant" style={{ paddingTop: "20px" }}>
                    Mr./Ms: <span style={{ fontWeight: "bold" }}>{student.name} </span> is granted to take Entrance Examination on <span style={{ fontWeight: "bold" }}>{formattedDate}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "50px" }}>
                    <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "12px", width: "200px" }}>
                        <span style={{ textDecoration: "underline" }}>Ms. Thelma Laxamana</span>
                        <br />
                        Registrar
                    </div>
                </div>

                <h3 style={{ marginTop: "25px" }}>Entrance Examination Results</h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", rowGap: "6px", columnGap: "120px", width: "60%", marginTop: "15px", marginBottom: "15px", textAlign: "left" }}>
                    {subjects.map((s) => {
                        // Pass both name and ID to check edited values source
                        const subjectScore = getSubjectScore(s.name, s._id);
                        return (
                            <div key={s._id} style={{ display: "flex", gap: "8px" }}>
                                <span style={{ width: "20px", fontWeight: "bold", borderBottom: "1px solid black", textAlign: "center" }}>
                                    {subjectScore}
                                </span>
                                <span style={{ textTransform: "uppercase" }}>{s.name}</span>
                            </div>
                        );
                    })}
                </div>

                <div style={{ fontWeight: "bold", marginTop: "10px", textAlign: "right", width: "60%" }}>
                    TOTAL SCORE: <span style={{ borderBottom: "2px solid black", padding: "0 10px" }}>{printScore}</span>
                </div>

                <div style={{ textAlign: "center", marginLeft: "400px", marginTop: "30px" }}>
                    ____________________________<br />Signature
                </div>

                <div style={{ marginTop: "15px" }}>
                    Noted by:<br /><br />
                    <strong>PABLO MENDIOGARIN, MAED-GC</strong><br />
                    <span style={{ marginLeft: "45px" }}>Guidance Counselor</span>
                </div>
            </div>
        </div>
    );
}