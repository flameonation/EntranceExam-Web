import React, { useState, useRef, useEffect } from 'react';
import './admincss/admindashboard.css';
import knsLogo from '../assets/images/knslogo.png';
import jpcsLogo from '../assets/images/JPCS.jpg';
import QuestionsPage from './QuestionsPage';
import ResultsPage from './ResultPage';
import StudentListPage from './StudentListPage';
import Swal from 'sweetalert2';
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

function RoomsData() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRooms, setExpandedRooms] = useState({});
    const [expandedStudents, setExpandedStudents] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState('rooms');

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

    const getRoleFilteredStudents = () => {
        if (isSuperAdmin) return students;
        return students.filter(s => s.room === adminRole);
    };

    const getStudentsByRoom = (roomId) => {
        return students.filter(s => {
            const matchRoom = s.room === roomId;
            if (!matchRoom) return false;
            if (!isSuperAdmin && s.room !== adminRole) return false;
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                s.name?.toLowerCase().includes(q) ||
                s.firstCourse?.toLowerCase().includes(q) ||
                s.lastSchool?.toLowerCase().includes(q)
            );
        });
    };

    const roleStudents = getRoleFilteredStudents();
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
                        <div className="rd-search-box">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <input className="rd-search-input" placeholder="Search name, course, school…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>

            <div className="rd-stats-row">
                <div className="rd-stat-card rd-stat-total">
                    <div className="rd-stat-icon"><RDUsersIcon /></div>
                    <div className="rd-stat-body">
                        <span className="rd-stat-num">{totalExaminees}</span>
                        <span className="rd-stat-lbl">Total Examinees</span>
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
                                                <p>No examinees registered in this room.</p>
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

function OperationalOverview() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const adminRole = localStorage.getItem("admin_role");
    const isSuperAdmin = adminRole === 'superadmin';

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setStudents(data);
            } catch {
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = isSuperAdmin ? students : students.filter(s => s.room === adminRole);

    const total = filteredStudents.length;
    const avrCount = isSuperAdmin ? students.filter(s => s.room === 'avr').length : (adminRole === 'avr' ? filteredStudents.length : 0);
    const comlabCount = isSuperAdmin ? students.filter(s => s.room === 'comlab-2').length : (adminRole === 'comlab-2' ? filteredStudents.length : 0);
    const avrPct = total > 0 ? Math.round((avrCount / total) * 100) : 0;
    const comlabPct = total > 0 ? Math.round((comlabCount / total) * 100) : 0;

    const cx = 80, cy = 80, r = 60;
    const toRad = (deg) => (deg - 90) * (Math.PI / 180);
    const avrAngle = total > 0 ? (avrCount / total) * 360 : 0;
    const x1 = cx + r * Math.cos(toRad(0));
    const y1 = cy + r * Math.sin(toRad(0));
    const x2 = cx + r * Math.cos(toRad(avrAngle));
    const y2 = cy + r * Math.sin(toRad(avrAngle));
    const largeArc = avrAngle > 180 ? 1 : 0;
    const avrPath = total === 0 ? '' : avrCount === total
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const comlabPath = total === 0 ? '' : comlabCount === total
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
        : `M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 ${1 - largeArc} 1 ${x1} ${y1} Z`;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px', color: '#64748b', fontSize: '13px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'ov-spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Loading overview...
        </div>
    );

    const singleRoomColor = adminRole === 'avr' ? '#0ea5e9' : '#8b5cf6';
    const singleRoomLabel = adminRole === 'avr' ? 'AVR' : 'Computer Lab 2';

    return (
        <div style={{ padding: '4px 0' }}>
            <style>{`@keyframes ov-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            {isSuperAdmin ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                        {[
                            { label: 'Total Examinees', value: total, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', sub: 'registered' },
                            { label: 'AVR', value: avrCount, color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', sub: `${avrPct}% of total` },
                            { label: 'Computer Lab 2', value: comlabCount, color: '#8b5cf6', bg: '#faf5ff', border: '#ddd6fe', sub: `${comlabPct}% of total` },
                        ].map(card => (
                            <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</span>
                                <span style={{ fontSize: '28px', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</span>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{card.sub}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '32px' }}>
                        <div style={{ flexShrink: 0 }}>
                            <svg width="160" height="160" viewBox="0 0 160 160">
                                {total === 0 ? (
                                    <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
                                ) : (
                                    <>
                                        <path d={avrPath} fill="#0ea5e9" />
                                        <path d={comlabPath} fill="#8b5cf6" />
                                    </>
                                )}
                                <circle cx={cx} cy={cy} r={36} fill="#ffffff" />
                                <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a">{total}</text>
                                <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">TOTAL</text>
                            </svg>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { label: 'AVR', count: avrCount, pct: avrPct, color: '#0ea5e9' },
                                { label: 'Computer Lab 2', count: comlabCount, pct: comlabPct, color: '#8b5cf6' },
                            ].map(row => (
                                <div key={row.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: row.color, flexShrink: 0 }} />
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{row.label}</span>
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: row.color }}>
                                            {row.count} <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '11px' }}>({row.pct}%)</span>
                                        </span>
                                    </div>
                                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: '99px', transition: 'width 0.6s ease' }} />
                                    </div>
                                </div>
                            ))}
                            {total === 0 && <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>No examinees registered yet.</p>}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {(() => {
                        const todayKey = new Date().toISOString().slice(0, 10);
                        const todayDayName = DAY_NAMES[new Date().getDay()];
                        const todayCount = filteredStudents.filter(s => {
                            const key = formatDateKey(s.createdAt || s.registeredAt);
                            return key === todayKey;
                        }).length;
                        const todayMale = filteredStudents.filter(s => {
                            const key = formatDateKey(s.createdAt || s.registeredAt);
                            return key === todayKey && s.sex === 'Male';
                        }).length;
                        const todayFemale = filteredStudents.filter(s => {
                            const key = formatDateKey(s.createdAt || s.registeredAt);
                            return key === todayKey && s.sex === 'Female';
                        }).length;
                        const barPct = total > 0 ? Math.round((todayCount / total) * 100) : 0;

                        return (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Examinees</span>
                                        <span style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>{total}</span>
                                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>registered in your room</span>
                                    </div>
                                    <div style={{ background: adminRole === 'avr' ? '#f0f9ff' : '#faf5ff', border: `1px solid ${adminRole === 'avr' ? '#bae6fd' : '#ddd6fe'}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today — {todayDayName}</span>
                                        <span style={{ fontSize: '28px', fontWeight: 800, color: singleRoomColor, lineHeight: 1 }}>{todayCount}</span>
                                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            {todayMale}M &nbsp;·&nbsp; {todayFemale}F &nbsp;·&nbsp; {barPct}% of total
                                        </span>
                                    </div>
                                </div>
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: singleRoomColor }} />
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{singleRoomLabel}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Today: <strong style={{ color: singleRoomColor }}>{todayCount}</strong></span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total: <strong style={{ color: '#0f172a' }}>{total}</strong></span>
                                        </div>
                                    </div>
                                    <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
                                        <div style={{ height: '100%', width: `${barPct}%`, background: singleRoomColor, borderRadius: '99px', transition: 'width 0.6s ease' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        {[
                                            { label: 'Male today', value: todayMale, color: '#0ea5e9' },
                                            { label: 'Female today', value: todayFemale, color: '#ec4899' },
                                            { label: 'All-time total', value: total, color: '#16a34a' },
                                        ].map(item => (
                                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                                <span style={{ fontSize: '11px', color: '#64748b' }}>{item.label}:</span>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: item.color }}>{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {total === 0 && <p style={{ fontSize: '12px', color: '#94a3b8', margin: '10px 0 0' }}>No examinees registered yet.</p>}
                                </div>
                            </>
                        );
                    })()}
                </>
            )}
        </div>
    );
}

const Icon = ({ name }) => {
    const icons = {
        dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>,
        students: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
        questions: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22h.01" /><path d="M7 18v-3a5 5 0 1 1 10 0v1a2 2 0 0 0 2 2h1" /><path d="M21 15V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" /></svg>,
        examSettings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="m9 16 2 2 4-4" /></svg>,
        results: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h.01" /><path d="M12 16h.01" /></svg>,
        settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>,
        logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>,
        search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
        bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
        lock: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
    };
    return icons[name] || null;
};

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

const W = {
    bg: '#ffffff',
    bgSection: '#f8fafb',
    bgInput: '#ffffff',
    bgHeader: '#062b14',
    border: '#e2e8f0',
    borderInput: '#cbd5e1',
    accent: '#16a34a',
    accentLight: '#22c55e',
    accentGlow: 'rgba(22,163,74,0.12)',
    accentBg: '#f0fdf4',
    textPrimary: '#0f172a',
    textMuted: '#64748b',
    textDim: '#94a3b8',
    headerText: '#ffffff',
    danger: '#ef4444',
    dangerBg: '#fef2f2',
    dangerBorder: '#fecaca',
};

const scInputStyle = {
    padding: '9px 12px',
    background: W.bgInput,
    border: `1px solid ${W.borderInput}`,
    borderRadius: '8px',
    color: W.textPrimary,
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
};

const SCInput = (props) => <input {...props} style={scInputStyle} />;

const SCSelect = ({ children, ...props }) => (
    <select {...props} style={{
        ...scInputStyle,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundColor: W.bgInput,
    }}>
        {children}
    </select>
);

const SCField = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, color: W.textMuted, letterSpacing: '0.4px', textTransform: 'uppercase' }}>{label}</label>
        {children}
    </div>
);

const SCSection = ({ title, children }) => (
    <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '3px', height: '14px', background: W.accent, borderRadius: '2px' }} />
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: W.textPrimary, letterSpacing: '0.4px', textTransform: 'uppercase' }}>{title}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{children}</div>
    </div>
);

const DEFAULT_PIN = import.meta.env.VITE_DEFAULT_PIN || '112233';
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
        if (digit && index < PIN_LENGTH - 1) inputRefs.current[index + 1].focus();
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
                    width: 52px; height: 60px; text-align: center;
                    font-size: 22px; font-weight: 700; border-radius: 12px;
                    border: 2px solid #e2e8f0; background: #f8fafb; color: #062b14;
                    outline: none; transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
                    font-family: 'Courier New', monospace; caret-color: transparent;
                }
                .pin-digit-input:focus { border-color: #16a34a; background: #f0fdf4; box-shadow: 0 0 0 3px rgba(22,163,74,0.18); }
                .pin-digit-input.pin-filled { border-color: #16a34a; background: #f0fdf4; color: #16a34a; }
                .pin-digit-input.pin-error { border-color: #ef4444 !important; background: #fef2f2 !important; color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.15) !important; }
            `}</style>
            <div style={{
                background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '420px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35)', overflow: 'hidden',
                animation: 'pinFadeIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
            }}>
                <div style={{ background: W.bgHeader, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="lock" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Access Restricted</h2>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>Enter 6-digit PIN to continue</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>×</button>
                </div>

                <div style={{ padding: '36px 32px 32px' }}>
                    <p style={{ textAlign: 'center', fontSize: '13px', color: W.textMuted, margin: '0 0 28px' }}>
                        This feature requires authorization.<br />Please enter the admin PIN to proceed.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px', animation: shake ? 'pinShake 0.55s ease' : 'none' }}>
                        {Array(PIN_LENGTH).fill(0).map((_, i) => (
                            <input key={i} ref={el => inputRefs.current[i] = el} type="password" inputMode="numeric" maxLength={1} value={digits[i]}
                                onChange={e => handleDigitChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
                                onPaste={i === 0 ? handlePaste : undefined}
                                className={`pin-digit-input${error ? ' pin-error' : digits[i] ? ' pin-filled' : ''}`} />
                        ))}
                    </div>
                    <div style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                        {error && (
                            <p style={{ margin: 0, fontSize: '12px', color: W.danger, display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
                                </svg>
                                Incorrect PIN. Please try again.
                            </p>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '28px' }}>
                        {Array(PIN_LENGTH).fill(0).map((_, i) => (
                            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i < filled ? (error ? W.danger : W.accent) : '#e2e8f0', transition: 'background 0.15s' }} />
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '12px', background: W.bg, border: `1px solid ${W.border}`, borderRadius: '10px', color: W.textMuted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        <button onClick={handleSubmit} disabled={filled < PIN_LENGTH} style={{ flex: 1, padding: '12px', background: filled === PIN_LENGTH ? W.accent : W.bgSection, border: `1px solid ${filled === PIN_LENGTH ? W.accent : W.border}`, borderRadius: '10px', color: filled === PIN_LENGTH ? '#ffffff' : W.textDim, fontSize: '13px', fontWeight: 700, cursor: filled === PIN_LENGTH ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s' }}>Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StudentCodeModal = ({ onClose }) => {
    const [form, setForm] = useState({
        name: '', dob: '', sex: '', contact: '', pob: '', address: '',
        firstCourse: '', secondCourse: '', lastSchool: '', lastSchoolAddress: '',
        transferee: false, transfereeCourse: '', guardian: '',
    });
    const [scores, setScores] = useState([]);
    const [subjectsLoading, setSubjectsLoading] = useState(true);
    const [subjectsError, setSubjectsError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const adminRole = localStorage.getItem("admin_role");

    React.useEffect(() => {
        const fetchSubjects = async () => {
            try {
                setSubjectsLoading(true);
                setSubjectsError(null);
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/subjects`);
                if (!res.ok) throw new Error('Failed to fetch subjects');
                const data = await res.json();
                setScores(data.map(s => ({ subjectId: s._id, subject: s.name, score: 0, total: 20 })));
            } catch (err) {
                setSubjectsError(err.message);
            } finally {
                setSubjectsLoading(false);
            }
        };
        fetchSubjects();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'secondCourse' && value !== '' && value === form.firstCourse) {
            Swal.fire({ icon: 'warning', title: 'Duplicate Course Selection', text: 'Your 2nd course choice must be different from your 1st course choice.', confirmButtonText: 'OK', confirmButtonColor: '#16a34a' });
            return;
        }
        if (name === 'firstCourse' && value !== '' && value === form.secondCourse) {
            Swal.fire({ icon: 'warning', title: 'Duplicate Course Selection', text: 'Your 1st course choice must be different from your 2nd course choice.', confirmButtonText: 'OK', confirmButtonColor: '#16a34a' });
            return;
        }
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleScoreChange = (i, val) => {
        setScores(prev => prev.map((s, idx) => idx === i ? { ...s, score: Math.min(s.total, Math.max(0, Number(val))) } : s));
    };

    const handleSubmit = async () => {
        setSaving(true);
        setSaveError(null);
        try {
            const userRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name, dob: form.dob, sex: form.sex, contact: form.contact,
                    pob: form.pob, address: form.address, firstCourse: form.firstCourse,
                    secondCourse: form.secondCourse, lastSchool: form.lastSchool,
                    lastSchoolAddress: form.lastSchoolAddress, transferee: form.transferee,
                    transfereeCourse: form.transfereeCourse, guardian: form.guardian,
                    room: adminRole === 'superadmin' ? 'avr' : adminRole,
                }),
            });
            if (!userRes.ok) { const errData = await userRes.json(); throw new Error(errData.error || 'Failed to register student'); }
            const userData = await userRes.json();
            const userId = userData.user._id;
            const totalScore = scores.reduce((a, s) => a + s.score, 0);
            const totalQuestions = scores.reduce((a, s) => a + s.total, 0);
            const resultRes = await fetch(`${import.meta.env.VITE_API_URL}/api/results/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, answers: [], score: totalScore, totalQuestions, subjectScores: scores.map(s => ({ subject: s.subject, score: s.score, total: s.total })) }),
            });
            if (!resultRes.ok) { const errData = await resultRes.json(); throw new Error(errData.error || 'Failed to save result'); }
            setSaveSuccess(true);
            setTimeout(() => onClose(), 1500);
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const totalScore = scores.reduce((a, s) => a + s.score, 0);
    const totalMax = scores.reduce((a, s) => a + s.total, 0);
    const canSubmit = !subjectsLoading && !subjectsError && !saving && !saveSuccess &&
        form.name && form.dob && form.sex && form.contact && form.address && form.firstCourse && form.lastSchool && form.guardian;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <div style={{ background: W.bg, borderRadius: '16px', width: '100%', maxWidth: '1100px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px', background: W.bgHeader, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Student Registration & Score Entry</h2>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Kolehiyo Ng Subic — Admissions</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>×</button>
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    <div style={{ flex: 1.3, overflowY: 'auto', padding: '24px 28px', borderRight: `1px solid ${W.border}`, background: W.bg }}>
                        <SCSection title="Personal Information">
                            <SCField label="Full Name *"><SCInput name="name" placeholder="Lastname, Firstname Middlename" value={form.name} onChange={handleChange} required /></SCField>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <SCField label="Date of Birth *"><SCInput type="date" name="dob" value={form.dob} onChange={handleChange} required /></SCField>
                                <SCField label="Sex *">
                                    <SCSelect name="sex" value={form.sex} onChange={handleChange} required>
                                        <option value="" disabled hidden>Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </SCSelect>
                                </SCField>
                                <SCField label="Contact No. *"><SCInput type="tel" name="contact" placeholder="09XXXXXXXXX" value={form.contact} onChange={handleChange} /></SCField>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <SCField label="Place of Birth"><SCInput name="pob" placeholder="City, Province" value={form.pob} onChange={handleChange} /></SCField>
                                <SCField label="Home Address *"><SCInput name="address" placeholder="Street, Barangay, City" value={form.address} onChange={handleChange} required /></SCField>
                            </div>
                        </SCSection>

                        <SCSection title="Course Preference">
                            <SCField label="1st Course Choice *">
                                <SCSelect name="firstCourse" value={form.firstCourse} onChange={handleChange} required>
                                    <option value="" disabled hidden>Select 1st Course</option>
                                    {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
                                </SCSelect>
                            </SCField>
                            <SCField label="2nd Course Choice">
                                <SCSelect name="secondCourse" value={form.secondCourse} onChange={handleChange}>
                                    <option value="" disabled hidden>Select 2nd Course</option>
                                    {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
                                </SCSelect>
                            </SCField>
                        </SCSection>

                        <SCSection title="Educational Background">
                            <SCField label="Last School Attended *"><SCInput name="lastSchool" placeholder="School Name" value={form.lastSchool} onChange={handleChange} required /></SCField>
                            <SCField label="Address of Last School"><SCInput name="lastSchoolAddress" placeholder="Street, Barangay, City" value={form.lastSchoolAddress} onChange={handleChange} /></SCField>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: W.bgSection, borderRadius: '8px', border: `1px solid ${W.border}`, cursor: 'pointer', marginTop: '4px' }}
                                onClick={() => setForm(p => ({ ...p, transferee: !p.transferee }))}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${form.transferee ? W.accent : W.borderInput}`, background: form.transferee ? W.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                                    {form.transferee && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                                <label style={{ fontSize: '13px', color: W.textMuted, cursor: 'pointer', userSelect: 'none' }}>I am a Transferee</label>
                            </div>
                            {form.transferee && (
                                <SCField label="Previous Course Taken *"><SCInput name="transfereeCourse" placeholder="Course Name" value={form.transfereeCourse} onChange={handleChange} required /></SCField>
                            )}
                        </SCSection>

                        <SCSection title="Guardian / Parent Information">
                            <SCField label="Guardian / Parent Full Name *"><SCInput name="guardian" placeholder="Lastname, Firstname" value={form.guardian} onChange={handleChange} required /></SCField>
                        </SCSection>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', background: W.bg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                            <div style={{ width: '3px', height: '14px', background: W.accent, borderRadius: '2px' }} />
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: W.textPrimary, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Score Entry</p>
                        </div>

                        <div style={{ background: W.bg, border: `1px solid ${W.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: W.bgSection }}>
                                        {['SUBJECT', 'SCORE', 'TOTAL'].map(h => (
                                            <th key={h} style={{ padding: '12px 16px', textAlign: h === 'SUBJECT' ? 'left' : 'center', fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', color: W.textMuted, textTransform: 'uppercase', borderBottom: `1px solid ${W.border}` }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjectsLoading ? (
                                        <tr><td colSpan={3} style={{ padding: '28px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: W.textMuted, fontSize: '13px' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={W.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                                Loading subjects...
                                            </div>
                                        </td></tr>
                                    ) : subjectsError ? (
                                        <tr><td colSpan={3} style={{ padding: '28px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: W.danger, fontSize: '13px' }}>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                                {subjectsError}
                                            </div>
                                        </td></tr>
                                    ) : (
                                        scores.map((s, i) => (
                                            <tr key={s.subjectId} style={{ borderBottom: `1px solid ${W.border}` }}>
                                                <td style={{ padding: '12px 16px', fontSize: '13px', color: W.textPrimary, fontWeight: 500 }}>{s.subject}</td>
                                                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                                    <input type="number" value={s.score} min={0} max={s.total} onChange={e => handleScoreChange(i, e.target.value)}
                                                        style={{ width: '64px', padding: '6px 10px', textAlign: 'center', background: W.accentBg, border: `1px solid ${W.accent}`, borderRadius: '8px', color: W.accent, fontSize: '14px', fontWeight: 700, outline: 'none', fontFamily: 'inherit' }} />
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: W.textMuted }}>{s.total}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {!subjectsLoading && !subjectsError && scores.length > 0 && (
                                    <tfoot>
                                        <tr style={{ background: W.bgSection, borderTop: `2px solid ${W.border}` }}>
                                            <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: W.textMuted, letterSpacing: '0.5px' }}>TOTAL</td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '16px', fontWeight: 800, color: W.accent }}>{totalScore}</td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: W.textMuted }}>{totalMax}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {saveError && (
                            <div style={{ marginBottom: '14px', padding: '12px 16px', background: W.dangerBg, border: `1px solid ${W.dangerBorder}`, borderRadius: '8px', color: W.danger, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                {saveError}
                            </div>
                        )}
                        {saveSuccess && (
                            <div style={{ marginBottom: '14px', padding: '12px 16px', background: W.accentBg, border: `1px solid ${W.accentLight}`, borderRadius: '8px', color: W.accent, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Student registered and scores saved successfully!
                            </div>
                        )}

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: `1px solid ${W.border}` }}>
                            <button onClick={onClose} style={{ padding: '10px 20px', background: W.bg, border: `1px solid ${W.border}`, borderRadius: '8px', color: W.textMuted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button onClick={handleSubmit} disabled={!canSubmit} style={{ padding: '10px 24px', background: canSubmit ? W.accent : W.bgSection, border: `1px solid ${canSubmit ? W.accent : W.border}`, borderRadius: '8px', color: canSubmit ? '#ffffff' : W.textDim, fontSize: '13px', fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                {saving && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>}
                                {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save & Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState('DASHBOARD');
    const [modalState, setModalState] = useState(null);

    useEffect(() => { document.title = "Admin Dashboard"; }, []);

    const adminRole = localStorage.getItem("admin_role");
    const adminLabel = localStorage.getItem("admin_label");
    const isSuperAdmin = adminRole === 'superadmin';
    const requiresPin = adminRole === 'avr' || adminRole === 'comlab-2';

    const allMenuItems = [
        { name: 'DASHBOARD', id: 'dashboard' },
        { name: 'ROOMS DATA', id: 'examSettings' },
        { name: 'STUDENT LIST', id: 'students' },
        { name: 'QUESTION BANK', id: 'questions' },
        { name: 'RESULTS', id: 'results' },
        { name: 'SETTINGS', id: 'settings' },
    ];

    const restrictedMenuItems = [
        { name: 'DASHBOARD', id: 'dashboard' },
        { name: 'STUDENT LIST', id: 'students' },
        { name: 'QUESTION BANK', id: 'questions' },
        { name: 'RESULTS', id: 'results' },
    ];

    const menuItems = isSuperAdmin ? allMenuItems : restrictedMenuItems;

    const handleLogout = async () => {
        const result = await Swal.fire({ title: 'Logout?', text: 'Are you sure you want to logout?', icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, logout', cancelButtonText: 'No, stay', confirmButtonColor: '#16a34a', cancelButtonColor: '#64748b' });
        if (result.isConfirmed) {
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_role");
            localStorage.removeItem("admin_label");
            window.location.href = "/admin/login";
        }
    };

    const handleStudentCodeClick = () => {
        if (requiresPin) setModalState('pin');
        else setModalState('studentCode');
    };

    const handlePinSuccess = () => setModalState('studentCode');
    const handleCloseAll = () => setModalState(null);

    const roomLabel = adminRole === 'avr' ? 'AVR' : adminRole === 'comlab-2' ? 'Computer Laboratory 2' : null;
    const avatarLogo = isSuperAdmin ? jpcsLogo : knsLogo;

    const renderMainContent = () => {
        switch (activeTab) {
            case 'QUESTION BANK': return <QuestionsPage />;
            case 'RESULTS': return <ResultsPage />;
            case 'STUDENT LIST': return <StudentListPage />;
            case 'ROOMS DATA': return <RoomsData />;
            case 'DASHBOARD':
                return (
                    <div className="kns-content-inner">
                        <div className="kns-welcome-banner">
                            <div className="kns-banner-left">
                                <h1>Entrance Exam Management</h1>
                                <p>
                                    {adminRole === 'avr'
                                        ? 'Welcome, AVR Admin!'
                                        : adminRole === 'comlab-2'
                                            ? 'Welcome, Comlab Admin!'
                                            : 'Welcome, JPCS Admin!'}
                                </p>
                            </div>
                        </div>
                        <div className="kns-dashboard-grid">
                            <div className="kns-activity-panel">
                                <div className="kns-panel-header">
                                    <h3>Operational Overview</h3>
                                </div>
                                <OperationalOverview />
                            </div>
                            <div className="kns-actions-panel">
                                <div className="kns-panel-header">
                                    <h3>Quick Actions</h3>
                                </div>
                                <div className="kns-actions-grid">
                                    <button className="kns-action-btn" onClick={handleStudentCodeClick}>Student Code</button>
                                    <button className="kns-action-btn" onClick={() => setActiveTab('STUDENT LIST')}>View Student List</button>
                                    <button className="kns-action-btn" onClick={() => setActiveTab('QUESTION BANK')}>View Question Bank</button>
                                    <button className="kns-action-btn" onClick={() => setActiveTab('RESULTS')}>View All Results</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="kns-content-inner">
                        <div className="kns-placeholder-box">
                            <h2>{activeTab} Module</h2>
                            <p>This section is currently under development.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="kns-admin-layout">
            <aside className="kns-sidebar">
                <div className="kns-logo-section">
                    <img src={knsLogo} alt="KNS Logo" className="kns-main-logo" />
                    <div className="kns-brand-info">
                        <span className="kns-brand-name">Kolehiyo Ng Subic</span>
                        <span className="kns-dept-name">Entrance Exam Admin</span>
                        {roomLabel && <span style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.5px', marginTop: '2px' }}>{roomLabel}</span>}
                    </div>
                </div>
                <nav className="kns-side-nav">
                    {menuItems.map((item) => (
                        <button key={item.id} className={`kns-nav-link ${activeTab === item.name ? 'active' : ''}`} onClick={() => setActiveTab(item.name)}>
                            <span className="kns-nav-icon-wrapper"><Icon name={item.id} /></span>
                            {item.name}
                        </button>
                    ))}
                </nav>
                <button className="kns-logout-trigger" onClick={handleLogout}>
                    <Icon name="logout" /> <span>Logout</span>
                </button>
            </aside>

            <main className="kns-main-viewport">
                <header className="kns-topbar">
                    <div className="kns-search-wrapper">
                    </div>
                    <div className="kns-admin-profile">
                        <div className="kns-profile-data">
                            <div className="kns-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #16a34a', flexShrink: 0 }}>
                                <img src={avatarLogo} alt="Admin Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div className="kns-admin-text">
                                <p className="kns-user-name">{adminLabel}</p>
                                <p className="kns-user-role">{isSuperAdmin ? 'JPCS President' : 'Room Admin'}</p>
                            </div>
                        </div>
                    </div>
                </header>
                <section className="kns-dynamic-content">
                    {renderMainContent()}
                </section>
            </main>

            {modalState === 'pin' && <PinGateModal onSuccess={handlePinSuccess} onClose={handleCloseAll} />}
            {modalState === 'studentCode' && <StudentCodeModal onClose={handleCloseAll} />}
        </div>
    );
}
