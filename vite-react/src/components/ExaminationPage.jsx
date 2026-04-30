import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import '../css/student_css/examinationPage.css';
import knsLogo from '../assets/images/knslogo.png';

export default function Examination() {
    const API_URL = import.meta.env.VITE_API_URL;
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [isExamFinished, setIsExamFinished] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [subjectOrder, setSubjectOrder] = useState([]);

    const user = JSON.parse(localStorage.getItem("exam_user"));
    const room = localStorage.getItem("exam_room");

    const roomPath = room === "avr" ? "/register-avr" : "/register-comlab";

    useEffect(() => {
        if (!user) window.location.href = roomPath;
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem("saved_answers");
        if (saved) setAnswers(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem("saved_answers", JSON.stringify(answers));
    }, [answers]);

    useEffect(() => {
        fetch(`${API_URL}/api/all-questions`)
            .then(res => {
                if (!res.ok) throw new Error("Server Error");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) setQuestions(data);
                else setQuestions([]);
            })
            .catch(() => {
                setQuestions([]);
                Swal.fire("Error", "Failed to load questions", "error");
            });

        fetch(`${API_URL}/api/subjects`)
            .then(res => {
                if (!res.ok) throw new Error("Server Error");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) setSubjectOrder(data.map(s => s.name));
            })
            .catch(() => {});
    }, [API_URL]);

    function handleAnswerChange(questionId, value) {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    }

    async function finishExam() {
        if (isExamFinished) return;

        const unanswered = questions.filter(q => !answers[q._id]);
        if (unanswered.length > 0) {
            const proceed = await Swal.fire({
                title: "Unanswered Questions",
                text: `You have ${unanswered.length} unanswered question(s). Submit anyway?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, submit anyway",
                confirmButtonColor: "#0e7f2c"
            });
            if (!proceed.isConfirmed) return;
        } else {
            const confirm = await Swal.fire({
                title: "Submit Exam?",
                text: "Are you sure you want to finish and submit?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, submit",
                confirmButtonColor: "#0e7f2c"
            });
            if (!confirm.isConfirmed) return;
        }

        try {
            const res = await fetch(`${API_URL}/api/exam/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user?._id, answers })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                localStorage.removeItem("saved_answers");
                localStorage.removeItem("exam_user");
                localStorage.removeItem("exam_room");
                setIsExamFinished(true);
                await Swal.fire({ title: "Exam Completed!", icon: "success", timer: 2000, showConfirmButton: false });
                window.location.href = roomPath;
            } else {
                Swal.fire("Error", data.message || "Submission failed.", "error");
            }
        } catch (err) {
            Swal.fire("Error", "Network error while submitting.", "error");
        }
    }

    const questionsBySubject = {};
    if (Array.isArray(questions)) {
        questions.forEach(q => {
            const subject = q.subjectId?.name || "General";
            if (!questionsBySubject[subject]) questionsBySubject[subject] = [];
            questionsBySubject[subject].push(q);
        });
    }

    const orderedSubjects = subjectOrder.length > 0
        ? [
            ...subjectOrder.filter(s => questionsBySubject[s]),
            ...Object.keys(questionsBySubject).filter(s => !subjectOrder.includes(s))
          ]
        : Object.keys(questionsBySubject);

    if (isExamFinished) {
        return (
            <div className="exam-bg-header">
                <header className="exam-header-banner">
                    <img src={knsLogo} alt="KNS Logo" className="banner-logo" />
                    <h1 className="exam-banner-title">KOLEHIYO NG SUBIC</h1>
                </header>
                <div className="exam-only-wrapper exam-finished">
                    <div className="finish-message" style={{ textAlign: "center", padding: "40px" }}>
                        <h2>Exam Completed! 🎉</h2>
                        <p>Redirecting to registration...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="exam-bg-header">
            <header className="exam-header-banner">
                <img src={knsLogo} alt="KNS Logo" className="banner-logo" />
                <h1 className="exam-banner-title">KOLEHIYO NG SUBIC</h1>
                <p>ENTRANCE EXAMINATION</p>
            </header>

            <div className="exam-only-wrapper">
                <header className="exam-only-header" style={{ display: 'block', textAlign: 'left' }}>
                    <h1 className="exam-only-title" style={{ marginBottom: '10px', fontSize: '20px' }}>
                        {user?.name}
                    </h1>
                    <div style={{ fontSize: '13px', fontWeight: '600', lineHeight: '1.6' }}>
                        <div style={{ color: '#0e7f2c' }}>
                            <span style={{ color: '#555' }}>1ST CHOICE: </span> {user?.firstCourse}
                        </div>
                        <div style={{ color: '#0e7f2c' }}>
                            <span style={{ color: '#555' }}>2ND CHOICE: </span> {user?.secondCourse}
                        </div>
                    </div>
                </header>

                <form onSubmit={(e) => { e.preventDefault(); finishExam(); }}>
                    <div className="questions-column">
                        {orderedSubjects.map(subject => (
                            <div key={subject}>
                                <h3 className="subject-title-ui">{subject.toUpperCase()}</h3>
                                {questionsBySubject[subject].map((question, index) => (
                                    <div key={question._id} className="question-item-card">
                                        <h2 className="question-text">{index + 1}. {question.text}</h2>
                                        <div className="options-grid">
                                            {["A", "B", "C", "D"].map(letter => {
                                                const option = question.options?.[letter];
                                                if (!option) return null;
                                                const optionId = `q${question._id}-${letter}`;
                                                return (
                                                    <div key={optionId} className="option-item">
                                                        <input
                                                            type="radio"
                                                            id={optionId}
                                                            name={`question-${question._id}`}
                                                            value={letter}
                                                            checked={answers[question._id] === letter}
                                                            onChange={() => handleAnswerChange(question._id, letter)}
                                                        />
                                                        <label htmlFor={optionId}>
                                                            <span className="option-letter">{letter}.</span>
                                                            {option}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}

                        <footer className="exam-only-footer">
                            <button type="submit" className="final-submit">
                                Finish Exam & Submit Answers
                            </button>
                        </footer>
                    </div>
                </form>

                <button className="fab-reading" onClick={() => setShowModal(true)}>
                    For No. 16-20 ENGLISH
                </button>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>For Number 16 - 20</h2>
                            <p style={{ lineHeight: '2.2', marginBottom: '25px' }}>
                                Cancer is a disease in which cells somehow become activated into uncontrolled
                                multiplication and thus produce an overgrowth, or tumor, composed of malformed,
                                malignant cells. Cancerous tumors can occur in almost any tissue of the body,
                                although some are more often affected than others. Three general kinds of cancer
                                are recognized: carcinomas, which involve epithelial tissue; sarcomas, which affect
                                connective tissues including bones; and leukemias, which start in the bone marrow
                                and lymphatic tissues and spread in the blood and lymph.
                            </p>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}