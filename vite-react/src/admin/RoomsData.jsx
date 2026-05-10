import React, { useState, useEffect } from 'react';
import './admincss/RoomsData.css';

const ROOMS = [
    { id: 'avr', label: 'AVR', color: '#16a34a', glow: 'rgba(22,163,74,0.18)' },
    { id: 'comlab-2', label: 'Computer Lab 2', color: '#0ea5e9', glow: 'rgba(14,165,233,0.18)' },
];

const RDChevronIcon = ({ open }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const RDUsersIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const RDMaleIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="14" r="5" />
        <line x1="19" y1="5" x2="14.14" y2="9.86" />
        <polyline points="15 5 19 5 19 9" />
    </svg>
);

const RDFemaleIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <line x1="12" y1="13" x2="12" y2="21" />
        <line x1="9" y1="18" x2="15" y2="18" />
    </svg>
);

const RDTransfereeIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
);

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDateKey(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
}

function formatDisplayDate(dateKey) {
    if (!dateKey) return '—';
    const d = new Date(dateKey + 'T00:00:00');
    const day = DAY_NAMES[d.getDay()];
    return `${day}, ${d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}`;
}

function DailyBreakdownTable({ students, roomFilter }) {
    const filtered = roomFilter ? students.filter(s => s.room === roomFilter) : students;

    const byDay = {};
    filtered.forEach(s => {
        const key = formatDateKey(s.createdAt || s.registeredAt || s.dob);
        if (!key) return;
        if (!byDay[key]) byDay[key] = { total: 0, male: 0, female: 0, transferee: 0 };
        byDay[key].total += 1;
        if (s.sex === 'Male') byDay[key].male += 1;
        if (s.sex === 'Female') byDay[key].female += 1;
        if (s.transferee) byDay[key].transferee += 1;
    });

    const days = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

    if (days.length === 0) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No daily data available yet.
            </div>
        );
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#f8fafb' }}>
                        {['Day / Date', 'Total', 'Male', 'Female', 'Transferees'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Day / Date' ? 'left' : 'center', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {days.map((day, idx) => {
                        const row = byDay[day];
                        return (
                            <tr key={day} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafb', borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{formatDisplayDate(day)}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#16a34a', fontSize: '15px' }}>{row.total}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'center', color: '#0ea5e9', fontWeight: 600 }}>{row.male}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'center', color: '#ec4899', fontWeight: 600 }}>{row.female}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'center', color: '#8b5cf6', fontWeight: 600 }}>{row.transferee}</td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr style={{ background: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#064e3b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grand Total</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#16a34a', fontSize: '16px' }}>{filtered.length}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#0ea5e9' }}>{filtered.filter(s => s.sex === 'Male').length}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#ec4899' }}>{filtered.filter(s => s.sex === 'Female').length}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#8b5cf6' }}>{filtered.filter(s => s.transferee).length}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

export default function RoomsData() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRooms, setExpandedRooms] = useState({});
    const [expandedStudents, setExpandedStudents] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState('rooms');
    const todayISO = new Date().toISOString().slice(0, 10);
    const [filterDate, setFilterDate] = useState(todayISO);

    const adminRole = localStorage.getItem("admin_role");
    const isSuperAdmin = adminRole === 'superadmin';

    const visibleRooms = isSuperAdmin
        ? ROOMS
        : ROOMS.filter(r => r.id === adminRole);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
                if (!res.ok) throw new Error('Failed to fetch students');
                const data = await res.json();
                setStudents(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const toggleRoom = (roomId) => setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
    const toggleStudent = (studentId) => setExpandedStudents(prev => ({ ...prev, [studentId]: !prev[studentId] }));

    const getStudentsByRoom = (roomId) => {
        return students.filter(s => {
            if (s.room !== roomId) return false;
            if (!isSuperAdmin && s.room !== adminRole) return false;

            if (filterDate) {
                const regKey = formatDateKey(s.createdAt || s.registeredAt);
                if (regKey !== filterDate) return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return (
                    s.name?.toLowerCase().includes(q) ||
                    s.firstCourse?.toLowerCase().includes(q) ||
                    s.lastSchool?.toLowerCase().includes(q)
                );
            }
            return true;
        });
    };

    const roleStudents = (isSuperAdmin ? students : students.filter(s => s.room === adminRole))
        .filter(s => !filterDate || formatDateKey(s.createdAt || s.registeredAt) === filterDate);

    const totalExaminees = roleStudents.length;
    const totalMale = roleStudents.filter(s => s.sex === 'Male').length;
    const totalFemale = roleStudents.filter(s => s.sex === 'Female').length;
    const totalTransferee = roleStudents.filter(s => s.transferee).length;

    const formatDate = (dob) => {
        if (!dob) return '—';
        const d = new Date(dob);
        return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getAge = (dob) => {
        if (!dob) return '—';
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const isToday = filterDate === todayISO;
    const filterLabel = filterDate
        ? (isToday ? 'Today' : formatDisplayDate(filterDate))
        : 'All Dates';

    return (
        <div className="rd-root">
            <div className="rd-header-strip">
                <div className="rd-header-left">
                    <h1 className="rd-title">Rooms Data</h1>
                    <p className="rd-subtitle">
                        {isSuperAdmin ? 'Live examinee count per room' : `Live examinee count — ${adminRole === 'avr' ? 'AVR' : 'Computer Lab 2'}`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                        <button onClick={() => setActiveView('rooms')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: activeView === 'rooms' ? '#ffffff' : 'transparent', color: activeView === 'rooms' ? '#0f172a' : '#64748b', boxShadow: activeView === 'rooms' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>Rooms View</button>
                        <button onClick={() => setActiveView('daily')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: activeView === 'daily' ? '#ffffff' : 'transparent', color: activeView === 'daily' ? '#0f172a' : '#64748b', boxShadow: activeView === 'daily' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>Daily Totals</button>
                    </div>

                    {activeView === 'rooms' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', borderRadius: '8px', padding: '4px 10px 4px 8px', border: filterDate && !isToday ? '1.5px solid #16a34a' : '1.5px solid transparent', transition: 'border-color 0.15s' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={filterDate && !isToday ? '#16a34a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                <line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: 600, color: filterDate && !isToday ? '#16a34a' : '#0f172a', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                            />
                            {filterDate && (
                                <button
                                    onClick={() => setFilterDate('')}
                                    title="Show all dates"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 2px', display: 'flex', alignItems: 'center', color: '#94a3b8', lineHeight: 1 }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {activeView === 'rooms' && (
                        <div className="rd-search-box">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <input className="rd-search-input" placeholder="Search name, course, school…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>

            {activeView === 'rooms' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: isToday ? '#f0fdf4' : filterDate ? '#fffbeb' : '#f8fafb', border: `1px solid ${isToday ? '#bbf7d0' : filterDate ? '#fde68a' : '#e2e8f0'}`, borderRadius: '10px', marginBottom: '4px', fontSize: '12px', fontWeight: 600, color: isToday ? '#15803d' : filterDate ? '#92400e' : '#64748b' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                    {filterDate
                        ? <>Showing examinees registered on <strong style={{ marginLeft: '3px' }}>{filterLabel}</strong> — {totalExaminees} found</>
                        : <>Showing <strong>all registered examinees</strong> — {totalExaminees} total</>
                    }
                    {!filterDate && (
                        <button onClick={() => setFilterDate(todayISO)} style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            Jump to Today
                        </button>
                    )}
                </div>
            )}

            <div className="rd-stats-row">
                <div className="rd-stat-card rd-stat-total">
                    <div className="rd-stat-icon"><RDUsersIcon /></div>
                    <div className="rd-stat-body">
                        <span className="rd-stat-num">{totalExaminees}</span>
                        <span className="rd-stat-lbl">{filterDate ? `${isToday ? "Today's" : "Day's"} Examinees` : 'Total Examinees'}</span>
                    </div>
                </div>
                <div className="rd-stat-card rd-stat-male">
                    <div className="rd-stat-icon"><RDMaleIcon /></div>
                    <div className="rd-stat-body">
                        <span className="rd-stat-num">{totalMale}</span>
                        <span className="rd-stat-lbl">Male</span>
                    </div>
                </div>
                <div className="rd-stat-card rd-stat-female">
                    <div className="rd-stat-icon"><RDFemaleIcon /></div>
                    <div className="rd-stat-body">
                        <span className="rd-stat-num">{totalFemale}</span>
                        <span className="rd-stat-lbl">Female</span>
                    </div>
                </div>
                <div className="rd-stat-card rd-stat-transferee">
                    <div className="rd-stat-icon"><RDTransfereeIcon /></div>
                    <div className="rd-stat-body">
                        <span className="rd-stat-num">{totalTransferee}</span>
                        <span className="rd-stat-lbl">Transferees</span>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="rd-loading">
                    <div className="rd-spinner" />
                    <span>Loading room data…</span>
                </div>
            )}

            {error && (
                <div className="rd-error">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                    {error}
                </div>
            )}

            {!loading && !error && activeView === 'daily' && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '3px', height: '16px', background: '#16a34a', borderRadius: '2px' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            {isSuperAdmin ? 'All Rooms — Daily Examinee Totals' : `${adminRole === 'avr' ? 'AVR' : 'Computer Lab 2'} — Daily Examinee Totals`}
                        </span>
                    </div>
                    {isSuperAdmin ? (
                        <div>
                            {ROOMS.map((room, idx) => (
                                <div key={room.id} style={{ borderBottom: idx < ROOMS.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                    <div style={{ padding: '10px 20px', background: '#f8fafb', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: room.color }} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{room.label}</span>
                                    </div>
                                    <DailyBreakdownTable students={students} roomFilter={room.id} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <DailyBreakdownTable students={students} roomFilter={adminRole} />
                    )}
                </div>
            )}

            {!loading && !error && activeView === 'rooms' && (
                <div className="rd-rooms-list">
                    {visibleRooms.map(room => {
                        const roomStudents = getStudentsByRoom(room.id);
                        const isOpen = expandedRooms[room.id];
                        const maleCount = roomStudents.filter(s => s.sex === 'Male').length;
                        const femaleCount = roomStudents.filter(s => s.sex === 'Female').length;
                        const transfereeCount = roomStudents.filter(s => s.transferee).length;

                        return (
                            <div className={`rd-room-card ${isOpen ? 'rd-room-open' : ''}`} key={room.id} style={{ '--room-color': room.color, '--room-glow': room.glow }}>
                                <button className="rd-room-header" onClick={() => toggleRoom(room.id)}>
                                    <div className="rd-room-dot" />
                                    <div className="rd-room-info">
                                        <span className="rd-room-name">{room.label}</span>
                                        <div className="rd-room-pills">
                                            <span className="rd-pill rd-pill-male"><RDMaleIcon />{maleCount}M</span>
                                            <span className="rd-pill rd-pill-female"><RDFemaleIcon />{femaleCount}F</span>
                                            {transfereeCount > 0 && (
                                                <span className="rd-pill rd-pill-transfer"><RDTransfereeIcon />{transfereeCount} Transfer</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rd-room-count-badge">
                                        <span>{roomStudents.length}</span>
                                        <small>examinees</small>
                                    </div>
                                    <div className="rd-chevron"><RDChevronIcon open={isOpen} /></div>
                                </button>

                                {isOpen && (
                                    <div className="rd-room-body">
                                        {roomStudents.length === 0 ? (
                                            <div className="rd-empty-room">
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                </svg>
                                                <p>{filterDate ? `No examinees registered on ${filterLabel}.` : 'No examinees registered in this room.'}</p>
                                            </div>
                                        ) : (
                                            <div className="rd-student-list">
                                                {roomStudents.map((s, idx) => {
                                                    const isExpanded = expandedStudents[s._id];
                                                    return (
                                                        <div className={`rd-student-item ${isExpanded ? 'rd-student-expanded' : ''}`} key={s._id}>
                                                            <button className="rd-student-row" onClick={() => toggleStudent(s._id)}>
                                                                <div className="rd-student-num">{idx + 1}</div>
                                                                <div className="rd-student-avatar" style={{ background: s.sex === 'Male' ? 'rgba(14,165,233,0.12)' : 'rgba(236,72,153,0.12)', color: s.sex === 'Male' ? '#0ea5e9' : '#ec4899' }}>
                                                                    {s.sex === 'Male' ? <RDMaleIcon /> : <RDFemaleIcon />}
                                                                </div>
                                                                <div className="rd-student-main">
                                                                    <span className="rd-student-name">{s.name}</span>
                                                                    <span className="rd-student-course">{s.firstCourse}</span>
                                                                </div>
                                                                <div className="rd-student-meta">
                                                                    {s.transferee && <span className="rd-transfer-badge"><RDTransfereeIcon />Transferee</span>}
                                                                    {(s.createdAt || s.registeredAt) && (
                                                                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>
                                                                            {new Date(s.createdAt || s.registeredAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                        </span>
                                                                    )}
                                                                    <span className="rd-student-age">{getAge(s.dob)} yrs</span>
                                                                </div>
                                                                <div className="rd-expand-icon"><RDChevronIcon open={isExpanded} /></div>
                                                            </button>

                                                            {isExpanded && (
                                                                <div className="rd-student-details">
                                                                    <div className="rd-detail-grid">
                                                                        <div className="rd-detail-block"><span className="rd-detail-label">Date of Birth</span><span className="rd-detail-value">{formatDate(s.dob)}</span></div>
                                                                        <div className="rd-detail-block"><span className="rd-detail-label">Place of Birth</span><span className="rd-detail-value">{s.pob || '—'}</span></div>
                                                                        <div className="rd-detail-block"><span className="rd-detail-label">Contact</span><span className="rd-detail-value">{s.contact}</span></div>
                                                                        <div className="rd-detail-block"><span className="rd-detail-label">Address</span><span className="rd-detail-value">{s.address}</span></div>
                                                                        <div className="rd-detail-block"><span className="rd-detail-label">2nd Course Choice</span><span className="rd-detail-value">{s.secondCourse || '—'}</span></div>
                                                                        <div className="rd-detail-block"><span className="rd-detail-label">Last School</span><span className="rd-detail-value">{s.lastSchool}</span></div>
                                                                        <div className="rd-detail-block"><span className="rd-detail-label">School Address</span><span className="rd-detail-value">{s.lastSchoolAddress || '—'}</span></div>
                                                                        <div className="rd-detail-block"><span className="rd-detail-label">Guardian</span><span className="rd-detail-value">{s.guardian}</span></div>
                                                                        {(s.createdAt || s.registeredAt) && (
                                                                            <div className="rd-detail-block"><span className="rd-detail-label">Registered On</span><span className="rd-detail-value">{formatDisplayDate(formatDateKey(s.createdAt || s.registeredAt))}</span></div>
                                                                        )}
                                                                        {s.transferee && (
                                                                            <div className="rd-detail-block"><span className="rd-detail-label">Previous Course</span><span className="rd-detail-value">{s.transfereeCourse || '—'}</span></div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}