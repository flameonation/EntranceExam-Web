import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import Swal from "sweetalert2";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import "./admincss/questions.css";

const W = {
    bg: '#ffffff',
    bgSection: '#f8fafb',
    bgInput: '#ffffff',
    bgHeader: '#062b14',
    border: '#e2e8f0',
    borderInput: '#cbd5e1',
    accent: '#16a34a',
    accentLight: '#22c55e',
    accentBg: '#f0fdf4',
    textPrimary: '#0f172a',
    textMuted: '#64748b',
    textDim: '#94a3b8',
    danger: '#ef4444',
};

const DEFAULT_PIN = import.meta.env.VITE_DEFAULT_PIN_QUESTION || '112233';
const PIN_LENGTH = 6;

const PinGateModal = ({ onSuccess, onClose }) => {
    const [digits, setDigits] = useState(Array(PIN_LENGTH).fill(''));
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, []);

    const handleDigitChange = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const newDigits = [...digits];
        newDigits[index] = digit;
        setDigits(newDigits);
        setError(false);
        if (digit && index < PIN_LENGTH - 1) {
            inputRefs.current[index + 1].focus();
        }
        if (digit && index === PIN_LENGTH - 1) {
            const pin = [...newDigits.slice(0, PIN_LENGTH - 1), digit].join('');
            validatePin(pin);
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (digits[index]) {
                const newDigits = [...digits];
                newDigits[index] = '';
                setDigits(newDigits);
                setError(false);
            } else if (index > 0) {
                const newDigits = [...digits];
                newDigits[index - 1] = '';
                setDigits(newDigits);
                setError(false);
                inputRefs.current[index - 1].focus();
            }
        } else if (e.key === 'Enter') {
            const pin = digits.join('');
            if (pin.length === PIN_LENGTH) validatePin(pin);
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1].focus();
        } else if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
        if (!pasted) return;
        const newDigits = Array(PIN_LENGTH).fill('');
        for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
        setDigits(newDigits);
        setError(false);
        const nextEmpty = pasted.length < PIN_LENGTH ? pasted.length : PIN_LENGTH - 1;
        inputRefs.current[nextEmpty].focus();
        if (pasted.length === PIN_LENGTH) validatePin(pasted);
    };

    const validatePin = (pin) => {
        if (pin === DEFAULT_PIN) {
            onSuccess();
        } else {
            setError(true);
            setShake(true);
            setDigits(Array(PIN_LENGTH).fill(''));
            setTimeout(() => {
                setShake(false);
                if (inputRefs.current[0]) inputRefs.current[0].focus();
            }, 600);
        }
    };

    const handleSubmit = () => {
        const pin = digits.join('');
        if (pin.length === PIN_LENGTH) validatePin(pin);
    };

    const filled = digits.filter(d => d !== '').length;

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(6, 43, 20, 0.72)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <style>{`
                @keyframes pinShake {
                    0%,100% { transform: translateX(0); }
                    15% { transform: translateX(-8px); }
                    30% { transform: translateX(8px); }
                    45% { transform: translateX(-6px); }
                    60% { transform: translateX(6px); }
                    75% { transform: translateX(-3px); }
                    90% { transform: translateX(3px); }
                }
                @keyframes pinFadeIn {
                    from { opacity: 0; transform: scale(0.92) translateY(12px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .pin-digit-input {
                    width: 52px;
                    height: 60px;
                    text-align: center;
                    font-size: 22px;
                    font-weight: 700;
                    border-radius: 12px;
                    border: 2px solid #e2e8f0;
                    background: #f8fafb;
                    color: #062b14;
                    outline: none;
                    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
                    font-family: 'Courier New', monospace;
                    caret-color: transparent;
                }
                .pin-digit-input:focus {
                    border-color: #16a34a;
                    background: #f0fdf4;
                    box-shadow: 0 0 0 3px rgba(22,163,74,0.18);
                }
                .pin-digit-input.pin-filled {
                    border-color: #16a34a;
                    background: #f0fdf4;
                    color: #16a34a;
                }
                .pin-digit-input.pin-error {
                    border-color: #ef4444 !important;
                    background: #fef2f2 !important;
                    color: #ef4444 !important;
                    box-shadow: 0 0 0 3px rgba(239,68,68,0.15) !important;
                }
            `}</style>
            <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
                overflow: 'hidden',
                animation: 'pinFadeIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
            }}>
                <div style={{
                    background: W.bgHeader,
                    padding: '24px 28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Access Restricted</h2>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>Enter 6-digit PIN to continue</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px', color: 'white', width: '32px', height: '32px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                    }}>×</button>
                </div>

                <div style={{ padding: '36px 32px 32px' }}>
                    <p style={{
                        textAlign: 'center', fontSize: '13px',
                        color: W.textMuted, margin: '0 0 28px',
                    }}>
                        This feature requires authorization.<br />Please enter the admin PIN to proceed.
                    </p>

                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px',
                        animation: shake ? 'pinShake 0.55s ease' : 'none',
                    }}>
                        {Array(PIN_LENGTH).fill(0).map((_, i) => (
                            <input
                                key={i}
                                ref={el => inputRefs.current[i] = el}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                value={digits[i]}
                                onChange={e => handleDigitChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                onPaste={i === 0 ? handlePaste : undefined}
                                className={`pin-digit-input${error ? ' pin-error' : digits[i] ? ' pin-filled' : ''}`}
                            />
                        ))}
                    </div>

                    <div style={{
                        height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '20px',
                    }}>
                        {error && (
                            <p style={{
                                margin: 0, fontSize: '12px', color: W.danger,
                                display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600,
                            }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
                                </svg>
                                Incorrect PIN. Please try again.
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '28px' }}>
                        {Array(PIN_LENGTH).fill(0).map((_, i) => (
                            <div key={i} style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: i < filled ? (error ? W.danger : W.accent) : '#e2e8f0',
                                transition: 'background 0.15s',
                            }} />
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onClose} style={{
                            flex: 1, padding: '12px',
                            background: W.bg, border: `1px solid ${W.border}`,
                            borderRadius: '10px', color: W.textMuted,
                            fontSize: '13px', fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}>Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={filled < PIN_LENGTH}
                            style={{
                                flex: 1, padding: '12px',
                                background: filled === PIN_LENGTH ? W.accent : W.bgSection,
                                border: `1px solid ${filled === PIN_LENGTH ? W.accent : W.border}`,
                                borderRadius: '10px',
                                color: filled === PIN_LENGTH ? '#ffffff' : W.textDim,
                                fontSize: '13px', fontWeight: 700,
                                cursor: filled === PIN_LENGTH ? 'pointer' : 'not-allowed',
                                fontFamily: 'inherit', transition: 'all 0.2s',
                            }}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Question() {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [questions, setQuestions] = useState({});
    const [newSubject, setNewSubject] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [pinUnlocked, setPinUnlocked] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const adminRole = localStorage.getItem("admin_role");
    const requiresPin = adminRole === 'avr' || adminRole === 'comlab-2';

    const [form, setForm] = useState({
        text: "",
        A: "",
        B: "",
        C: "",
        D: "",
        correct: "A",
        editId: null,
    });

    const API_URL = `${import.meta.env.VITE_API_URL}/api`;

    useEffect(() => {
        if (requiresPin && !pinUnlocked) {
            setShowPin(true);
        } else {
            fetchSubjects();
        }
    }, []);

    useEffect(() => {
        if (pinUnlocked) {
            fetchSubjects();
        }
    }, [pinUnlocked]);

    const fetchSubjects = async () => {
        try {
            const res = await axios.get(`${API_URL}/subjects`);
            setSubjects(res.data);
            if (res.data.length > 0 && !selectedSubject) {
                setSelectedSubject(res.data[0]._id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (selectedSubject) fetchQuestions(selectedSubject);
    }, [selectedSubject]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedSubject]);

    const fetchQuestions = async (id) => {
        try {
            const res = await axios.get(`${API_URL}/questions/${id}`);
            setQuestions((p) => ({ ...p, [id]: res.data }));
        } catch (err) {
            console.error(err);
        }
    };

    const currentQuestions = questions[selectedSubject] || [];
    const totalPages = Math.ceil(currentQuestions.length / itemsPerPage);
    const paginatedQuestions = currentQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    const handleAddSubject = async () => {
        if (!newSubject.trim()) return;
        try {
            const res = await axios.post(`${API_URL}/subjects`, { name: newSubject.trim() });
            const updatedSubjects = [...subjects, res.data];
            setSubjects(updatedSubjects);
            if (!selectedSubject) setSelectedSubject(res.data._id);
            setNewSubject("");
            Swal.fire("Added!", "New subject created.", "success");
        } catch (err) {
            Swal.fire("Error", "Failed to add subject.", "error");
        }
    };

    const deleteSubject = async (id, name) => {
        const result = await Swal.fire({
            title: "Delete Subject?",
            text: `This will delete "${name}" and all its questions. This cannot be undone!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#c53030",
            cancelButtonColor: "#718096",
            confirmButtonText: "Yes, delete it!"
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_URL}/subjects/${id}`);
                const updated = subjects.filter(s => s._id !== id);
                setSubjects(updated);
                if (selectedSubject === id) {
                    setSelectedSubject(updated.length > 0 ? updated[0]._id : null);
                    setQuestions(p => {
                        const copy = { ...p };
                        delete copy[id];
                        return copy;
                    });
                }
                Swal.fire("Deleted!", "Subject has been removed.", "success");
            } catch (err) {
                Swal.fire("Error", "Failed to delete subject.", "error");
            }
        }
    };

    const openModal = (q = null) => {
        if (!selectedSubject) {
            Swal.fire("Wait!", "Please add and select a Subject first.", "warning");
            return;
        }
        if (q) {
            setForm({
                text: q.text,
                A: q.options.A,
                B: q.options.B,
                C: q.options.C,
                D: q.options.D,
                correct: q.correct.trim().toUpperCase(),
                editId: q._id
            });
        } else {
            setForm({ text: "", A: "", B: "", C: "", D: "", correct: "A", editId: null });
        }
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.text.trim() || !form.A.trim() || !form.B.trim() || !form.C.trim() || !form.D.trim()) {
            Swal.fire("Error", "All fields are required.", "error");
            return;
        }

        const payload = {
            subjectId: selectedSubject,
            text: form.text.trim(),
            options: {
                A: form.A.trim(),
                B: form.B.trim(),
                C: form.C.trim(),
                D: form.D.trim()
            },
            correct: form.correct.trim().toUpperCase(),
        };

        try {
            const res = form.editId
                ? await axios.put(`${API_URL}/questions/${form.editId}`, payload)
                : await axios.post(`${API_URL}/questions`, payload);

            setQuestions((p) => ({
                ...p,
                [selectedSubject]: form.editId
                    ? p[selectedSubject].map((q) => (q._id === res.data._id ? res.data : q))
                    : [...(p[selectedSubject] || []), res.data],
            }));
            setModalOpen(false);
            Swal.fire("Saved!", "Question has been saved.", "success");
        } catch (err) {
            Swal.fire("Error", err.response?.data?.error || "Failed to save question.", "error");
        }
    };

    const deleteQuestion = async (id) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#0c4222",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_URL}/questions/${id}`);
                setQuestions(p => ({
                    ...p,
                    [selectedSubject]: p[selectedSubject].filter(q => q._id !== id)
                }));
                Swal.fire("Deleted!", "Question removed.", "success");
            } catch (err) {
                Swal.fire("Error", "Failed to delete question.", "error");
            }
        }
    };

    const onDragEnd = async (r) => {
        if (!r.destination) return;
        const arr = [...questions[selectedSubject]];
        const [m] = arr.splice(r.source.index, 1);
        arr.splice(r.destination.index, 0, m);
        setQuestions((p) => ({ ...p, [selectedSubject]: arr }));
        await axios.put(`${API_URL}/questions/reorder`, { orderedIds: arr.map((q) => q._id) });
    };

    if (showPin && requiresPin && !pinUnlocked) {
        return (
            <>
                <div className="kns-q-page" />
                <PinGateModal
                    onSuccess={() => {
                        setPinUnlocked(true);
                        setShowPin(false);
                    }}
                    onClose={() => setShowPin(false)}
                />
            </>
        );
    }

    if (showPin === false && requiresPin && !pinUnlocked) {
        return (
            <div className="kns-q-page">
                <div className="empty-state" style={{ marginTop: '80px', textAlign: 'center' }}>
                    <p style={{ color: W.textMuted, fontSize: '15px' }}>Access denied. PIN verification is required.</p>
                    <button
                        className="btn-primary"
                        style={{ marginTop: '16px' }}
                        onClick={() => setShowPin(true)}
                    >
                        Enter PIN
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="kns-q-page">
            <div className="kns-q-header">
                <div className="header-info">
                    <h1>Question Bank</h1>
                    <p>Manage your curriculum and examination database</p>
                </div>
                <div className="header-btns">
                    <button className="btn-primary" onClick={() => openModal()}>+ Create Question</button>
                </div>
            </div>

            <div className="category-bar">
                <div className="category-scroll">
                    {subjects.length === 0 ? (
                        <span className="no-subjects">No subjects found. Add one →</span>
                    ) : (
                        subjects.map((s) => (
                            <div key={s._id} className={`cat-pill-wrapper ${selectedSubject === s._id ? "active" : ""}`}>
                                <button className="cat-pill" onClick={() => setSelectedSubject(s._id)}>
                                    {s.name}
                                </button>
                                <button
                                    className="cat-trash-btn"
                                    onClick={(e) => { e.stopPropagation(); deleteSubject(s._id, s.name); }}
                                    title="Delete subject"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
                <div className="quick-add-cat">
                    <input
                        placeholder="New Subject Name..."
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
                    />
                    <button className="btn-add-sub" onClick={handleAddSubject}>Add Subject</button>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="questions">
                    {(provided) => (
                        <div className="q-list-container" {...provided.droppableProps} ref={provided.innerRef}>
                            {paginatedQuestions.length > 0 ? (
                                paginatedQuestions.map((q, i) => (
                                    <Draggable key={q._id} draggableId={q._id} index={i}>
                                        {(p) => (
                                            <div className="q-modern-card" ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
                                                <div className="q-main">
                                                    <div className="q-title-row">
                                                        <h4>{(currentPage - 1) * itemsPerPage + i + 1}. {q.text}</h4>
                                                        <div className="q-btns-row">
                                                            <button className="btn-edit" onClick={() => openModal(q)}>Edit</button>
                                                            <button className="btn-del" onClick={() => deleteQuestion(q._id)}>Delete</button>
                                                        </div>
                                                    </div>
                                                    <div className="options-display-grid">
                                                        {["A", "B", "C", "D"].map(letter => (
                                                            <div key={letter} className={`opt-item ${q.correct.trim().toUpperCase() === letter ? "is-correct-text" : ""}`}>
                                                                <span className="opt-val">{letter}. {q.options[letter]}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="answer-line">
                                                        Answer is <strong>{q.correct.trim().toUpperCase()}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))
                            ) : (
                                <div className="empty-state">
                                    {selectedSubject ? "No questions in this subject yet." : "Select a subject to view questions."}
                                </div>
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {totalPages > 1 && (
                <div className="q-pagination">
                    <button
                        className="q-page-btn"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    {getPageNumbers().map(page => (
                        <button
                            key={page}
                            className={`q-page-btn ${page === currentPage ? 'q-page-active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        className="q-page-btn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {modalOpen && (
                <div className="kns-modal-overlay">
                    <div className="kns-modal-content">
                        <h3>{form.editId ? "Update Question" : "New Question"}</h3>
                        <div className="modal-form">
                            <div className="input-group">
                                <label>QUESTION</label>
                                <textarea
                                    rows="4"
                                    className="full-width-input"
                                    value={form.text}
                                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                                    placeholder="Enter question text..."
                                />
                            </div>
                            <div className="modal-options-list">
                                {["A", "B", "C", "D"].map(letter => (
                                    <div key={letter} className="input-group">
                                        <label>{letter}</label>
                                        <input
                                            className="full-width-input"
                                            value={form[letter]}
                                            onChange={(e) => setForm({ ...form, [letter]: e.target.value })}
                                            placeholder={`Answer ${letter}`}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="input-group">
                                <label>CORRECT ANSWER</label>
                                <select
                                    className="full-width-input"
                                    value={form.correct}
                                    onChange={(e) => setForm({ ...form, correct: e.target.value })}
                                >
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                </select>
                            </div>
                            <div className="m-actions">
                                <button className="btn-text" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button className="btn-primary" onClick={handleSubmit}>Save Question</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}