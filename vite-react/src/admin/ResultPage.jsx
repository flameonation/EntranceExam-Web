import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Pencil, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, Search, Eye, X, CheckCircle2, XCircle } from "lucide-react";
import StudentPrint from "./PrintPage";
import "./admincss/resultPage.css";

export default function ResultsPage() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedResult, setSelectedResult] = useState(null);
    const [filterDate, setFilterDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingResult, setEditingResult] = useState(null);
    const [subjectScores, setSubjectScores] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'submittedAt', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewingResult, setViewingResult] = useState(null);
    const [viewQuestions, setViewQuestions] = useState([]);
    const [viewLoading, setViewLoading] = useState(false);

    const API_URL = `${import.meta.env.VITE_API_URL}/api`;
    const adminRole = localStorage.getItem("admin_role");
    const isSuperAdmin = adminRole === 'superadmin';

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await axios.get(`${API_URL}/all-results`);
            setResults(res.data);
            setLoading(false);
        } catch (err) {
            setLoading(false);
            Swal.fire("Error", "Could not fetch results", "error");
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedResults = useMemo(() => {
        let items = [...results];
        if (!isSuperAdmin && adminRole) {
            items = items.filter(r => r.userId?.room === adminRole);
        }
        if (filterDate) {
            items = items.filter(r => new Date(r.submittedAt).toISOString().split("T")[0] === filterDate);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter(r => r.userId?.name?.toLowerCase().includes(q));
        }
        items.sort((a, b) => {
            let valA, valB;
            if (sortConfig.key === 'name') {
                valA = a.userId?.name?.toLowerCase() || "";
                valB = b.userId?.name?.toLowerCase() || "";
            } else {
                valA = new Date(a[sortConfig.key]);
                valB = new Date(b[sortConfig.key]);
            }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return items;
    }, [results, filterDate, searchQuery, sortConfig, adminRole, isSuperAdmin]);

    const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
    const paginatedResults = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedResults.slice(start, start + itemsPerPage);
    }, [sortedResults, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterDate, searchQuery, sortConfig]);

    const handlePrint = (userData, resultData) => {
        setSelectedStudent(null);
        setSelectedResult(null);
        setTimeout(() => {
            setSelectedStudent(userData);
            setSelectedResult(resultData);
        }, 100);
    };

    const handleDelete = async (resultId, userName) => {
        const confirm = await Swal.fire({
            title: "Delete Result?",
            text: `This will permanently delete the result for "${userName}".`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#c53030",
            cancelButtonColor: "#718096",
            confirmButtonText: "Yes, delete it!"
        });

        if (confirm.isConfirmed) {
            try {
                await axios.delete(`${API_URL}/results/${resultId}`);
                setResults(prev => prev.filter(r => r._id !== resultId));
                Swal.fire("Deleted!", "Result has been removed.", "success");
            } catch (err) {
                Swal.fire("Error", "Failed to delete result.", "error");
            }
        }
    };

    const handleEditOpen = async (result) => {
        try {
            const questionsRes = await axios.get(`${API_URL}/all-questions`);
            const allQuestions = questionsRes.data;
            const subjectMap = {};
            allQuestions.forEach(q => {
                const subjectName = q.subjectId?.name || "General";
                if (!subjectMap[subjectName]) subjectMap[subjectName] = [];
                subjectMap[subjectName].push(q._id.toString());
            });
            const answerMap = {};
            result.answers.forEach(a => {
                answerMap[a.questionId?.toString()] = a.isCorrect;
            });
            const scores = Object.entries(subjectMap).map(([subject, qIds]) => {
                const saved = result.subjectScores?.find(
                    s => s.subject.toLowerCase() === subject.toLowerCase()
                );
                const score = saved !== undefined
                    ? saved.score
                    : qIds.filter(id => answerMap[id] === true).length;
                return { subject, score, total: qIds.length };
            });
            setSubjectScores(scores);
            setEditingResult(result);
            setEditModalOpen(true);
        } catch (err) {
            Swal.fire("Error", "Failed to load subject breakdown.", "error");
        }
    };

    const handleViewOpen = async (result) => {
        setViewLoading(true);
        setViewingResult(result);
        setViewModalOpen(true);
        try {
            const questionsRes = await axios.get(`${API_URL}/all-questions`);
            setViewQuestions(questionsRes.data);
        } catch (err) {
            Swal.fire("Error", "Failed to load questions.", "error");
        }
        setViewLoading(false);
    };

    const handleScoreChange = (index, value) => {
        const updated = [...subjectScores];
        const parsed = parseInt(value);
        if (isNaN(parsed) || parsed < 0) return;
        if (parsed > updated[index].total) return;
        updated[index].score = parsed;
        setSubjectScores(updated);
    };

    const handleSaveEdit = async () => {
        const newTotal = subjectScores.reduce((sum, s) => sum + s.score, 0);
        try {
            const res = await axios.put(`${API_URL}/results/${editingResult._id}`, {
                score: newTotal,
                subjectScores: subjectScores
            });
            setResults(prev => prev.map(r =>
                r._id === editingResult._id ? res.data : r
            ));
            setEditModalOpen(false);
            setEditingResult(null);
            Swal.fire("Saved!", "Score updated successfully.", "success");
        } catch (err) {
            Swal.fire("Error", "Failed to save score.", "error");
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage, '...', totalPages);
            }
        }
        return pages;
    };

    const roomLabel = adminRole === 'avr' ? 'AVR' : adminRole === 'comlab-2' ? 'Computer Laboratory 2' : null;

    const buildViewData = () => {
        if (!viewingResult || !viewQuestions.length) return [];

        const answerMap = {};
        viewingResult.answers.forEach(a => {
            answerMap[a.questionId?.toString()] = {
                selected: a.selectedOption,
                isCorrect: a.isCorrect
            };
        });

        const subjectMap = {};
        viewQuestions.forEach(q => {
            const subject = q.subjectId?.name || "General";
            if (!subjectMap[subject]) subjectMap[subject] = [];
            subjectMap[subject].push({ ...q, answerData: answerMap[q._id?.toString()] });
        });

        return Object.entries(subjectMap).map(([subject, questions]) => ({ subject, questions }));
    };

    const viewData = buildViewData();

    return (
        <div className="kns-res-page">
            <div className="print-only">
                {selectedStudent && (
                    <StudentPrint
                        student={selectedStudent}
                        result={selectedResult}
                        onReady={() => {
                            window.print();
                            setSelectedStudent(null);
                            setSelectedResult(null);
                        }}
                    />
                )}
            </div>

            <div className="kns-res-header no-print">
                <div className="res-header-info">
                    <h1>Examination Results</h1>
                    <p>
                        {roomLabel && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                borderRadius: '6px', padding: '2px 10px',
                                fontSize: '12px', fontWeight: 700, color: '#16a34a',
                                marginRight: '10px'
                            }}>
                                {roomLabel}
                            </span>
                        )}
                        Total Students: {sortedResults.length}
                    </p>
                </div>
                <div className="res-filter-bar">
                    <div className="res-search-wrap">
                        <Search size={14} className="res-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="res-search-input"
                        />
                        {searchQuery && (
                            <button className="res-search-clear" onClick={() => setSearchQuery("")}>✕</button>
                        )}
                    </div>
                    <label>Filter by Date:</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="res-date-input"
                    />
                    {filterDate && (
                        <button className="res-clear-btn" onClick={() => setFilterDate("")}>Clear</button>
                    )}
                </div>
            </div>

            <div className="res-list-container no-print">
                {loading ? (
                    <div className="res-empty-state">Loading results...</div>
                ) : sortedResults.length === 0 ? (
                    <div className="res-empty-state">No results found{roomLabel ? ` for ${roomLabel}` : ""}.</div>
                ) : (
                    <div className="kns-res-table-wrapper">
                        <table className="kns-res-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "50px" }}>#</th>
                                    <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                        NAME <ArrowUpDown size={14} style={{ marginLeft: '5px' }} />
                                    </th>
                                    <th onClick={() => handleSort('submittedAt')} style={{ cursor: 'pointer' }}>
                                        DATE/TIME <ArrowUpDown size={14} style={{ marginLeft: '5px' }} />
                                    </th>
                                    <th>SCORE</th>
                                    <th>PRINT RESULT</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedResults.map((res, index) => (
                                    <tr key={res._id} className="res-row-hover">
                                        <td style={{ fontWeight: "bold", color: "#718096" }}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td className="res-td-user">
                                            <span className="res-user-name">{res.userId?.name || "Unknown"}</span>
                                            <span className="res-user-sub">{res.userId?.email}</span>
                                        </td>
                                        <td className="res-td-date">
                                            {new Date(res.submittedAt).toLocaleDateString("en-US", {
                                                year: "numeric", month: "short", day: "numeric"
                                            })}
                                            <br />
                                            <small style={{ color: '#a0aec0' }}>
                                                {new Date(res.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </small>
                                        </td>
                                        <td className="res-td-bold">{res.score} / {res.totalQuestions}</td>
                                        <td>
                                            <button className="res-btn-print" onClick={() => handlePrint(res.userId, res)}>
                                                Print Form
                                            </button>
                                        </td>
                                        <td className="res-td-actions">
                                            <button className="res-btn-view" title="View Answers" onClick={() => handleViewOpen(res)}>
                                                <Eye size={18} />
                                            </button>
                                            <button className="res-btn-edit" title="Edit Score" onClick={() => handleEditOpen(res)}>
                                                <Pencil size={18} />
                                            </button>
                                            <button className="res-btn-delete" title="Delete" onClick={() => handleDelete(res._id, res.userId?.name)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="res-pagination">
                                <button
                                    className="res-page-btn"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                {getPageNumbers().map((page, idx) => (
                                    <button
                                        key={idx}
                                        className={`res-page-btn ${page === currentPage ? 'res-page-active' : ''} ${page === '...' ? 'res-page-dots' : ''}`}
                                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                                        disabled={page === '...'}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    className="res-page-btn"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {editModalOpen && editingResult && (
                <div className="kns-modal-overlay">
                    <div className="kns-modal-content">
                        <h3>Edit Score — {editingResult.userId?.name}</h3>
                        <table className="edit-score-table">
                            <thead>
                                <tr>
                                    <th>SUBJECT</th>
                                    <th>SCORE</th>
                                    <th>TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjectScores.map((s, i) => (
                                    <tr key={s.subject}>
                                        <td>{s.subject}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="score-edit-input"
                                                value={s.score}
                                                min={0}
                                                max={s.total}
                                                onChange={(e) => handleScoreChange(i, e.target.value)}
                                            />
                                        </td>
                                        <td>{s.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td><strong>TOTAL</strong></td>
                                    <td><strong>{subjectScores.reduce((s, r) => s + r.score, 0)}</strong></td>
                                    <td><strong>{subjectScores.reduce((s, r) => s + r.total, 0)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                        <div className="m-actions" style={{ marginTop: "20px" }}>
                            <button className="btn-text" onClick={() => { setEditModalOpen(false); setEditingResult(null); }}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveEdit}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {viewModalOpen && viewingResult && (
                <div className="kns-view-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setViewModalOpen(false); setViewingResult(null); setViewQuestions([]); } }}>
                    <div className="kns-view-modal">
                        <div className="kns-view-modal-header">
                            <div className="kns-view-modal-student">
                                <h2>{viewingResult.userId?.name || "Unknown Student"}</h2>
                                <div className="kns-view-modal-meta">
                                    <span className="kns-view-score-badge">
                                        Final Score: <strong>{viewingResult.score} / {viewingResult.totalQuestions}</strong>
                                    </span>
                                    <span className="kns-view-date-badge">
                                        {new Date(viewingResult.submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                    </span>
                                </div>
                            </div>
                            <button className="kns-view-close-btn" onClick={() => { setViewModalOpen(false); setViewingResult(null); setViewQuestions([]); }}>
                                <X size={22} />
                            </button>
                        </div>

                        <div className="kns-view-legend">
                            <span className="legend-item legend-correct"><CheckCircle2 size={14} /> Correct Answer</span>
                            <span className="legend-item legend-wrong"><XCircle size={14} /> Wrong Answer</span>
                            <span className="legend-item legend-key"><span className="legend-key-dot" />Correct Key (Right Panel)</span>
                        </div>

                        {viewLoading ? (
                            <div className="kns-view-loading">Loading questions...</div>
                        ) : (
                            <div className="kns-view-body">
                                <div className="kns-view-col kns-view-left">
                                    <div className="kns-view-col-header">
                                        <span>STUDENT ANSWERS</span>
                                    </div>
                                    <div className="kns-view-col-content">
                                        {viewData.map(({ subject, questions }) => (
                                            <div key={subject} className="kns-view-subject-block">
                                                <h3 className="kns-view-subject-title">{subject.toUpperCase()}</h3>
                                                {questions.map((q, idx) => {
                                                    const answered = q.answerData?.selected && q.answerData.selected !== "N/A";
                                                    const isCorrect = q.answerData?.isCorrect;
                                                    const selectedOption = q.answerData?.selected;

                                                    return (
                                                        <div
                                                            key={q._id}
                                                            className={`kns-view-question-card ${!answered ? 'kns-view-unanswered' : isCorrect ? 'kns-view-card-correct' : 'kns-view-card-wrong'}`}
                                                        >
                                                            <div className="kns-view-question-top">
                                                                <span className="kns-view-q-num">Q{idx + 1}</span>
                                                                <p className="kns-view-q-text">{q.text}</p>
                                                                {answered ? (
                                                                    isCorrect
                                                                        ? <CheckCircle2 size={18} className="kns-view-status-icon correct" />
                                                                        : <XCircle size={18} className="kns-view-status-icon wrong" />
                                                                ) : (
                                                                    <span className="kns-view-no-answer-tag">No Answer</span>
                                                                )}
                                                            </div>
                                                            <div className="kns-view-options-grid">
                                                                {["A", "B", "C", "D"].map(letter => {
                                                                    const optText = q.options?.[letter];
                                                                    if (!optText) return null;
                                                                    const isSelected = selectedOption === letter;
                                                                    const isThisCorrect = q.correct === letter;
                                                                    let optClass = "kns-view-option";
                                                                    if (isSelected && isCorrect) optClass += " kns-opt-selected-correct";
                                                                    else if (isSelected && !isCorrect) optClass += " kns-opt-selected-wrong";
                                                                    else if (!isSelected && isThisCorrect && answered && !isCorrect) optClass += " kns-opt-missed";
                                                                    return (
                                                                        <div key={letter} className={optClass}>
                                                                            <span className="kns-view-opt-letter">{letter}.</span>
                                                                            <span>{optText}</span>
                                                                            {isSelected && <span className="kns-opt-tag">{isCorrect ? "✓ Your Answer" : "✗ Your Answer"}</span>}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="kns-view-col kns-view-right">
                                    <div className="kns-view-col-header kns-view-col-header-right">
                                        <span>ANSWER KEY</span>
                                    </div>
                                    <div className="kns-view-col-content">
                                        {viewData.map(({ subject, questions }) => {
                                            const subjectResult = viewingResult.subjectScores?.find(
                                                s => s.subject.toLowerCase() === subject.toLowerCase()
                                            );
                                            return (
                                                <div key={subject} className="kns-view-subject-block">
                                                    <div className="kns-view-subject-title-row">
                                                        <h3 className="kns-view-subject-title">{subject.toUpperCase()}</h3>
                                                        {subjectResult && (
                                                            <span className="kns-view-subject-score">
                                                                {subjectResult.score}/{subjectResult.total}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {questions.map((q, idx) => {
                                                        const isCorrect = q.answerData?.isCorrect;
                                                        const answered = q.answerData?.selected && q.answerData.selected !== "N/A";
                                                        return (
                                                            <div key={q._id} className="kns-view-answer-key-row">
                                                                <span className="kns-view-ak-num">Q{idx + 1}</span>
                                                                <div className="kns-view-ak-content">
                                                                    <p className="kns-view-ak-qtext">{q.text}</p>
                                                                    <div className="kns-view-ak-answer">
                                                                        <span className="kns-view-ak-label">Correct:</span>
                                                                        <span className="kns-view-ak-letter">{q.correct}</span>
                                                                        <span className="kns-view-ak-opttext">{q.options?.[q.correct]}</span>
                                                                    </div>
                                                                    <div className="kns-view-ak-student-ans">
                                                                        <span className="kns-view-ak-label">Student:</span>
                                                                        {!answered ? (
                                                                            <span className="kns-ak-no-ans">No Answer</span>
                                                                        ) : (
                                                                            <span className={`kns-view-ak-student-letter ${isCorrect ? 'ak-correct' : 'ak-wrong'}`}>
                                                                                {q.answerData?.selected} — {q.options?.[q.answerData?.selected]}
                                                                                {isCorrect ? <CheckCircle2 size={13} style={{ marginLeft: 4 }} /> : <XCircle size={13} style={{ marginLeft: 4 }} />}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}