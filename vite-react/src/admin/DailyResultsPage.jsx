import React, { useEffect, useState, useMemo } from 'react';
import './admincss/DailyResultsPage.css';

const SCORE_BRACKETS = [
    { label: 'Board Course Passers', min: 60, max: Infinity },
    { label: 'Non-Board Course Passers', min: 50, max: 59 },
    { label: 'Waitlist', min: 0, max: 49 },
];

function getBracket(score) {
    return SCORE_BRACKETS.find(b => score >= b.min && score <= b.max) || SCORE_BRACKETS[2];
}

function isToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
}

function SkeletonBlock({ width = '100%', height = '16px', radius = '6px', style = {} }) {
    return (
        <div style={{
            width, height, borderRadius: radius,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonShimmer 1.4s infinite',
            ...style
        }} />
    );
}

export default function DailyResultsPage() {
    const [results, setResults] = useState([]);
    const [users, setUsers] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [selectedExaminer, setSelectedExaminer] = useState('');
    const [noteText, setNoteText] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [linkExpired, setLinkExpired] = useState(false);

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get('token');
        if (token) {
            try {
                const { exp } = JSON.parse(atob(token));
                if (Date.now() > exp) {
                    setLinkExpired(true);
                    setLoading(false);
                    return;
                }
            } catch {
                setLinkExpired(true);
                setLoading(false);
                return;
            }
        }

        const controller = new AbortController();
        const fetchData = async () => {
            try {
                const [resultsRes, usersRes, notesRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/all-results`, { signal: controller.signal }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/users`, { signal: controller.signal }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/notes`, { signal: controller.signal })
                ]);
                if (!resultsRes.ok || !usersRes.ok) throw new Error('fetch failed');
                const resultsData = await resultsRes.json();
                const usersData = await usersRes.json();
                const notesData = notesRes.ok ? await notesRes.json() : [];
                setResults(resultsData);
                setUsers(usersData);
                setNotes(notesData);
            } catch (e) {
                if (e.name !== 'AbortError') console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        return () => controller.abort();
    }, []);

    const data = useMemo(() => {
        const userMap = {};
        users.forEach(u => { userMap[u._id] = u; });

        const overallTotal = results.length;
        const todayResults = results.filter(r => isToday(r.submittedAt || r.createdAt));
        const todayTotal = todayResults.length;

        let avrToday = 0;
        let comlabToday = 0;
        const bracketCounts = { board: 0, nonBoard: 0, waitlist: 0 };

        todayResults.forEach(r => {
            const u = userMap[r.userId?._id || r.userId] || {};
            if (u.room === 'avr') avrToday++;
            if (u.room === 'comlab-2') comlabToday++;
            const bracket = getBracket(r.score ?? 0);
            if (bracket.label === 'Board Course Passers') bracketCounts.board++;
            else if (bracket.label === 'Non-Board Course Passers') bracketCounts.nonBoard++;
            else bracketCounts.waitlist++;
        });

        return { overallTotal, todayTotal, avrToday, comlabToday, bracketCounts };
    }, [results, users]);

    const todayExaminers = useMemo(() => {
        const userMap = {};
        users.forEach(u => { userMap[u._id] = u; });
        return results
            .filter(r => isToday(r.submittedAt || r.createdAt))
            .map(r => {
                const u = userMap[r.userId?._id || r.userId] || {};
                return { id: r.userId?._id || r.userId, name: u.name || 'Unknown' };
            })
            .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }, [results, users]);

    const todayNotes = useMemo(() => {
        const todayKey = new Date().toISOString().slice(0, 10);
        return notes.filter(n => n.date === todayKey);
    }, [notes]);

    const handleSaveNote = async () => {
        if (!selectedExaminer || !noteText.trim()) return;
        setSavingNote(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ examinerId: selectedExaminer, examinerName: todayExaminers.find(e => e.id === selectedExaminer)?.name || '', text: noteText.trim(), date: new Date().toISOString().slice(0, 10) })
            });
            if (!res.ok) throw new Error('save failed');
            const newNote = await res.json();
            setNotes(prev => [...prev, newNote]);
            setShowNoteModal(false);
            setSelectedExaminer('');
            setNoteText('');
        } catch (e) {
            console.error(e);
        } finally {
            setSavingNote(false);
        }
    };

    if (linkExpired) return (
        <div className="daily-results-loading">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#111827' }}>Oops!</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af', textAlign: 'center' }}>The link has been expired.<br />Contact the admin.</p>
        </div>
    );

    if (loading) return (
        <div className="daily-results-container">
            <div className="daily-results-header" style={{ paddingTop: '32px' }}>
                <SkeletonBlock width="80px" height="10px" radius="4px" style={{ margin: '0 auto 10px' }} />
                <SkeletonBlock width="160px" height="28px" radius="8px" style={{ margin: '0 auto 6px' }} />
                <SkeletonBlock width="120px" height="14px" radius="4px" style={{ margin: '0 auto' }} />
            </div>

            <div className="daily-results-hero">
                <div className="hero-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <SkeletonBlock width="100px" height="10px" radius="4px" />
                    <SkeletonBlock width="80px" height="44px" radius="8px" />
                </div>
            </div>

            <div className="daily-results-section">
                <SkeletonBlock width="80px" height="10px" radius="4px" style={{ marginLeft: '4px' }} />
                <div className="section-row">
                    <div className="compact-card" style={{ gap: '8px' }}>
                        <SkeletonBlock width="40px" height="10px" radius="4px" style={{ margin: '0 auto' }} />
                        <SkeletonBlock width="32px" height="24px" radius="6px" style={{ margin: '0 auto' }} />
                    </div>
                    <div className="compact-card" style={{ gap: '8px' }}>
                        <SkeletonBlock width="60px" height="10px" radius="4px" style={{ margin: '0 auto' }} />
                        <SkeletonBlock width="32px" height="24px" radius="6px" style={{ margin: '0 auto' }} />
                    </div>
                </div>
                <div className="section-row">
                    <div className="compact-card compact-full" style={{ gap: '8px' }}>
                        <SkeletonBlock width="50px" height="10px" radius="4px" style={{ margin: '0 auto' }} />
                        <SkeletonBlock width="32px" height="24px" radius="6px" style={{ margin: '0 auto' }} />
                    </div>
                </div>
            </div>

            <div className="daily-results-section">
                <SkeletonBlock width="100px" height="10px" radius="4px" style={{ marginLeft: '4px' }} />
                <div className="section-row section-row-3">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="compact-card" style={{ gap: '8px' }}>
                            <SkeletonBlock width="60px" height="10px" radius="4px" style={{ margin: '0 auto' }} />
                            <SkeletonBlock width="32px" height="24px" radius="6px" style={{ margin: '0 auto' }} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="daily-results-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SkeletonBlock width="40px" height="10px" radius="4px" style={{ marginLeft: '4px' }} />
                    <SkeletonBlock width="60px" height="22px" radius="6px" />
                </div>
                <div className="compact-card compact-full" style={{ gap: '8px', padding: '20px' }}>
                    <SkeletonBlock width="120px" height="10px" radius="4px" style={{ margin: '0 auto' }} />
                </div>
            </div>
        </div>
    );

    const { overallTotal, todayTotal, avrToday, comlabToday, bracketCounts } = data;
    const todayDate = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="daily-results-container">
            <div className="daily-results-header">
                <div className="header-badge">Daily Report</div>
                <h1>Exam Results</h1>
                <p className="header-date">{todayDate}</p>
            </div>

            <div className="daily-results-hero">
                <div className="hero-card">
                    <span className="hero-label">Overall Examinees</span>
                    <span className="hero-value">{overallTotal}</span>
                </div>
            </div>

            <div className="daily-results-section">
                <div className="section-title">Today's Activity</div>
                <div className="section-row">
                    <div className="compact-card">
                        <span className="compact-label">AVR</span>
                        <span className="compact-value">{avrToday}</span>
                    </div>
                    <div className="compact-card">
                        <span className="compact-label">COMLAB-2</span>
                        <span className="compact-value">{comlabToday}</span>
                    </div>
                </div>
                <div className="section-row">
                    <div className="compact-card compact-full">
                        <span className="compact-label">Total Today</span>
                        <span className="compact-value">{todayTotal}</span>
                    </div>
                </div>
            </div>

            <div className="daily-results-section">
                <div className="section-title">Score Breakdown</div>
                <div className="section-row section-row-3">
                    <div className="compact-card">
                        <span className="compact-label">Board Passer</span>
                        <span className="compact-value">{bracketCounts.board}</span>
                    </div>
                    <div className="compact-card">
                        <span className="compact-label">Non-Board</span>
                        <span className="compact-value">{bracketCounts.nonBoard}</span>
                    </div>
                    <div className="compact-card">
                        <span className="compact-label">Waitlist</span>
                        <span className="compact-value">{bracketCounts.waitlist}</span>
                    </div>
                </div>
            </div>

            <div className="daily-results-section">
                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Notes</span>
                    <button
                        onClick={() => setShowNoteModal(true)}
                        style={{
                            padding: '4px 10px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            color: '#16a34a',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        + Add Note
                    </button>
                </div>
                {todayNotes.length === 0 ? (
                    <div className="compact-card compact-full" style={{ padding: '20px' }}>
                        <span className="compact-label">No notes for today</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {todayNotes.map((note, idx) => (
                            <div key={idx} className="compact-card compact-full" style={{ textAlign: 'left', padding: '14px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{note.examinerName}</span>
                                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>{note.date}</span>
                                </div>
                                <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.4' }}>{note.text}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showNoteModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '400px',
                        padding: '24px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>Add Note</h3>
                            <button
                                onClick={() => { setShowNoteModal(false); setSelectedExaminer(''); setNoteText(''); }}
                                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Examiner</label>
                            <select
                                value={selectedExaminer}
                                onChange={e => setSelectedExaminer(e.target.value)}
                                style={{
                                    padding: '10px 12px',
                                    background: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    color: '#111827',
                                    fontSize: '13px',
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="" disabled>Select examiner</option>
                                {todayExaminers.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Note</label>
                            <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="Type your note here..."
                                rows={4}
                                style={{
                                    padding: '10px 12px',
                                    background: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    color: '#111827',
                                    fontSize: '13px',
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    resize: 'none',
                                    lineHeight: '1.5',
                                }}
                            />
                        </div>

                        <button
                            onClick={handleSaveNote}
                            disabled={!selectedExaminer || !noteText.trim() || savingNote}
                            style={{
                                padding: '12px',
                                background: selectedExaminer && noteText.trim() && !savingNote ? '#111827' : '#f3f4f6',
                                border: 'none',
                                borderRadius: '10px',
                                color: selectedExaminer && noteText.trim() && !savingNote ? '#ffffff' : '#9ca3af',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: selectedExaminer && noteText.trim() && !savingNote ? 'pointer' : 'not-allowed',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                            }}
                        >
                            {savingNote ? 'Saving...' : 'Save Note'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}