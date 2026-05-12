import React, { useState, useEffect, useRef } from 'react';
import './admincss/admindashboard.css';
import knsLogo from '../assets/images/knslogo.png';
import jpcsLogo from '../assets/images/JPCS.jpg';
import QuestionsPage from './QuestionsPage';
import ResultsPage from './ResultPage';
import StudentListPage from './StudentListPage';
import BoardPasserPage from './BoardPasserPage';
import SettingsPage from './SettingsPage';
import RegistersPage from './RegistersPage';
import RoomsData from './RoomsData';
import Swal from 'sweetalert2';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDateKey(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
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

const DEPT_CS = ['Bachelor of Science in Computer Science'];
const DEPT_BUS = [
    'Bachelor of Science in Accountancy',
    'Bachelor of Science in Business Administration (Financial Management)',
    'Bachelor of Science in Business Administration (Human Resource Management)',
    'Bachelor of Science in Business Administration (Operations Management)',
];
const DEPT_HM = ['Bachelor of Science in Hospitality Management'];
const DEPT_ED = [
    'Bachelor of Secondary Education major in Filipino (BSED \u2013 Filipino)',
    'Bachelor of Secondary Education major in English (BSED \u2013 English)',
    'Bachelor of Secondary Education major in Mathematics (BSED \u2013 Math)',
    'Bachelor of Secondary Education major in Social Studies (BSED \u2013 Social Studies)',
    'Bachelor of Elementary Education (BEEd)',
];

function getDept(course) {
    if (!course) return null;
    if (DEPT_CS.includes(course)) return 'cs';
    if (DEPT_BUS.includes(course)) return 'bus';
    if (DEPT_HM.includes(course)) return 'hm';
    if (DEPT_ED.includes(course)) return 'ed';
    return null;
}

const DEPT_META = {
    cs:  { label: 'Computer Science', color: '#8b5cf6', bg: '#faf5ff', border: '#ddd6fe' },
    bus: { label: 'Business / Accountancy', color: '#eab308', bg: '#fefce8', border: '#fde68a' },
    hm:  { label: 'Hospitality Management', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
    ed:  { label: 'Education', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
};

function DeptBarGraph({ results }) {
    const total = results.length;
    const counts = { cs: 0, bus: 0, hm: 0, ed: 0 };
    results.forEach(r => {
        const d = getDept(r.firstCourse);
        if (d) counts[d]++;
    });
    const maxCount = Math.max(...Object.values(counts), 1);

    return (
        <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '3px', height: '14px', background: '#16a34a', borderRadius: '2px' }} />
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#0f172a', letterSpacing: '0.4px', textTransform: 'uppercase' }}>Course Department Breakdown</p>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' }}>{total} total</span>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Object.entries(DEPT_META).map(([key, meta]) => {
                    const count = counts[key];
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                        <div key={key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: meta.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{meta.label}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: meta.color }}>{count}</span>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>({pct}%)</span>
                                </div>
                            </div>
                            <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${barPct}%`,
                                    background: meta.color,
                                    borderRadius: '99px',
                                    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                                }} />
                            </div>
                        </div>
                    );
                })}
                {total === 0 && (
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, textAlign: 'center' }}>No data available.</p>
                )}
            </div>
        </div>
    );
}

function generateTodayToken() {
    const now = new Date();
    // Start of current day (midnight) in local time
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    // End of day (midnight of next day)
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    return btoa(JSON.stringify({ ts: startOfDay, exp: endOfDay }));
}

function getTodayResultsUrl() {
    const token = generateTodayToken();
    const base = window.location.origin;
    return `${base}/daily-results?token=${token}`;
}

function QRCodeSVG({ value, size = 200 }) {
    const [qrDataUrl, setQrDataUrl] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function loadQR() {
            try {
                const QRCode = (await import('qrcode')).default;
                const url = await QRCode.toDataURL(value, { width: size, margin: 2, color: { dark: '#062b14', light: '#ffffff' } });
                if (!cancelled) setQrDataUrl(url);
            } catch {
                if (!cancelled) setQrDataUrl('error');
            }
        }
        loadQR();
        return () => { cancelled = true; };
    }, [value, size]);

    if (qrDataUrl === 'error') {
        return (
            <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafb', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#94a3b8', fontSize: '12px', textAlign: 'center', padding: '16px' }}>
                QR unavailable.<br />Copy the URL below.
            </div>
        );
    }

    if (!qrDataUrl) {
        return (
            <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            </div>
        );
    }

    return <img src={qrDataUrl} alt="QR Code" style={{ width: size, height: size, borderRadius: '12px', display: 'block' }} />;
}

function QRLinkModal({ onClose }) {
    const [url] = useState(() => getTodayResultsUrl());
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        function calcTime() {
            try {
                const token = new URL(url).searchParams.get('token');
                const { exp } = JSON.parse(atob(token));
                const diff = exp - Date.now();
                if (diff <= 0) { setTimeLeft('Expired'); return; }
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
            } catch { setTimeLeft('—'); }
        }
        calcTime();
        const id = setInterval(calcTime, 1000);
        return () => clearInterval(id);
    }, [url]);

    const handleCopy = () => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const isExpired = timeLeft === 'Expired';

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,43,20,0.72)', backdropFilter: 'blur(6px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <style>{`
                @keyframes qrModalIn { from{opacity:0;transform:scale(0.92) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)} }
                @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
            `}</style>
            <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', overflow: 'hidden', animation: 'qrModalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                <div style={{ background: '#062b14', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                                <rect x="14" y="14" width="3" height="3" rx="0.5"/><rect x="18" y="14" width="3" height="3" rx="0.5"/><rect x="14" y="18" width="3" height="3" rx="0.5"/><rect x="18" y="18" width="3" height="3" rx="0.5"/>
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Daily Results QR</h2>
                            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>Valid for 24 hours from generation</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', lineHeight: 1 }}>×</button>
                </div>

                <div style={{ padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '12px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '16px' }}>
                        <QRCodeSVG value={url} size={180} />
                    </div>

                    <div style={{ width: '100%', background: isExpired ? '#fef2f2' : '#f0fdf4', border: `1px solid ${isExpired ? '#fecaca' : '#bbf7d0'}`, borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isExpired ? '#ef4444' : '#16a34a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: isExpired ? '#ef4444' : '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {isExpired ? 'Link Expired' : 'Expires in'}
                            </span>
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: isExpired ? '#ef4444' : '#062b14', fontFamily: "'Courier New', monospace", letterSpacing: '2px' }}>
                            {timeLeft}
                        </span>
                    </div>

                    <div style={{ width: '100%' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Share URL</p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                            <div style={{ flex: 1, padding: '10px 12px', background: '#f8fafb', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px', color: '#475569', fontFamily: "'Courier New', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {url}
                            </div>
                            <button onClick={handleCopy} style={{ padding: '10px 14px', background: copied ? '#16a34a' : '#062b14', border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                {copied ? (
                                    <>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {isExpired && (
                        <div style={{ width: '100%', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>
                            This link has expired. Close and reopen to generate a new one.
                        </div>
                    )}

                    <button onClick={onClose} style={{ width: '100%', padding: '11px', background: '#f8fafb', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function OperationalOverview() {
    const [enrichedResults, setEnrichedResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('overall');
    const [showQRModal, setShowQRModal] = useState(false);

    const adminRole = localStorage.getItem("admin_role");
    const isSuperAdmin = adminRole === 'superadmin';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resultsRes, usersRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/all-results`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/users`)
                ]);
                if (!resultsRes.ok || !usersRes.ok) throw new Error();
                const resultsData = await resultsRes.json();
                const usersData = await usersRes.json();

                const userMap = {};
                usersData.forEach(u => { userMap[u._id] = u; });

                const merged = resultsData.map(r => {
                    const user = userMap[r.userId?._id || r.userId] || {};
                    return {
                        _id: r._id,
                        name: user.name || '—',
                        room: user.room || '—',
                        sex: user.sex || '—',
                        score: r.score,
                        totalQuestions: r.totalQuestions,
                        subjectScores: r.subjectScores || [],
                        submittedAt: r.submittedAt || r.createdAt || null,
                        firstCourse: user.firstCourse || '',
                    };
                });
                setEnrichedResults(merged);
            } catch {
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const todayKey = new Date().toISOString().slice(0, 10);
    const todayDayName = DAY_NAMES[new Date().getDay()];

    const allFiltered = isSuperAdmin ? enrichedResults : enrichedResults.filter(r => r.room === adminRole);
    const todayFiltered = allFiltered.filter(r => {
        if (!r.submittedAt) return false;
        return new Date(r.submittedAt).toISOString().slice(0, 10) === todayKey;
    });

    const activeResults = viewMode === 'overall' ? allFiltered : todayFiltered;

    const total = activeResults.length;
    const avrCount = isSuperAdmin
        ? activeResults.filter(r => r.room === 'avr').length
        : (adminRole === 'avr' ? total : 0);
    const comlabCount = isSuperAdmin
        ? activeResults.filter(r => r.room === 'comlab-2').length
        : (adminRole === 'comlab-2' ? total : 0);
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

    const singleRoomColor = adminRole === 'avr' ? '#0ea5e9' : '#8b5cf6';
    const singleRoomLabel = adminRole === 'avr' ? 'AVR' : 'Computer Lab 2';
    const maleCount = activeResults.filter(r => r.sex === 'Male').length;
    const femaleCount = activeResults.filter(r => r.sex === 'Female').length;
    const avgScore = total > 0 ? Math.round(activeResults.reduce((a, r) => a + (r.score || 0), 0) / total) : 0;
    const avgMax = total > 0 ? Math.round(activeResults.reduce((a, r) => a + (r.totalQuestions || 0), 0) / total) : 0;
    const passCount = activeResults.filter(r => r.score >= (r.totalQuestions * 0.5)).length;
    const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;

    const TabToggle = () => (
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '10px', padding: '3px', width: 'fit-content' }}>
            {[
                { key: 'overall', label: 'Overall' },
                { key: 'today', label: `Today — ${todayDayName}` },
            ].map(tab => (
                <button
                    key={tab.key}
                    onClick={() => setViewMode(tab.key)}
                    style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.18s',
                        background: viewMode === tab.key ? '#ffffff' : 'transparent',
                        color: viewMode === tab.key ? '#0f172a' : '#94a3b8',
                        boxShadow: viewMode === tab.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                    }}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div style={{ padding: '4px 0' }}>
                {isSuperAdmin ? (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} style={{ background: '#f8fafb', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <SkeletonBlock width="60%" height="10px" />
                                    <SkeletonBlock width="40%" height="28px" radius="8px" />
                                    <SkeletonBlock width="70%" height="10px" />
                                </div>
                            ))}
                        </div>
                        <div style={{ background: '#f8fafb', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '32px' }}>
                            <SkeletonBlock width="160px" height="160px" radius="50%" style={{ flexShrink: 0 }} />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {[0, 1].map(i => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <SkeletonBlock width="50%" height="12px" />
                                        <SkeletonBlock width="100%" height="8px" radius="99px" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            {[0, 1].map(i => (
                                <div key={i} style={{ background: '#f8fafb', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <SkeletonBlock width="60%" height="10px" />
                                    <SkeletonBlock width="40%" height="28px" radius="8px" />
                                    <SkeletonBlock width="70%" height="10px" />
                                </div>
                            ))}
                        </div>
                        <div style={{ background: '#f8fafb', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <SkeletonBlock width="50%" height="12px" />
                            <SkeletonBlock width="100%" height="10px" radius="99px" />
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {viewMode === 'today' && (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                            {todayFiltered.length} result{todayFiltered.length !== 1 ? 's' : ''} today
                        </span>
                    )}
                    {viewMode === 'today' && (
                        <button
                            onClick={() => setShowQRModal(true)}
                            title="Generate QR for Daily Results"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 11px',
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '8px',
                                color: '#16a34a',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'background 0.18s, box-shadow 0.18s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(22,163,74,0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" rx="1"/>
                                <rect x="14" y="3" width="7" height="7" rx="1"/>
                                <rect x="3" y="14" width="7" height="7" rx="1"/>
                                <rect x="14" y="14" width="3" height="3" rx="0.5"/>
                                <rect x="18" y="14" width="3" height="3" rx="0.5"/>
                                <rect x="14" y="18" width="3" height="3" rx="0.5"/>
                                <rect x="18" y="18" width="3" height="3" rx="0.5"/>
                            </svg>
                            Share QR
                        </button>
                    )}
                </div>
                <TabToggle />
            </div>

            {showQRModal && <QRLinkModal onClose={() => setShowQRModal(false)} />}

            {isSuperAdmin ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                        {[
                            { label: 'Total Results', value: enrichedResults.length, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', sub: 'all exam results in DB' },
                            { label: viewMode === 'overall' ? 'Total Registered' : "Today's Results", value: total, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', sub: viewMode === 'overall' ? 'matched with users' : todayDayName },
                            { label: 'AVR', value: avrCount, color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', sub: `${avrPct}% of ${viewMode === 'today' ? 'today' : 'total'}` },
                            { label: 'Computer Lab 2', value: comlabCount, color: '#8b5cf6', bg: '#faf5ff', border: '#ddd6fe', sub: `${comlabPct}% of ${viewMode === 'today' ? 'today' : 'total'}` },
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
                                <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">RESULTS</text>
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
                            {total === 0 && (
                                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                                    {viewMode === 'today' ? 'No results submitted today.' : 'No results found.'}
                                </p>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {viewMode === 'overall' ? 'Total Results' : "Today's Results"}
                            </span>
                            <span style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>{total}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {viewMode === 'overall' ? 'exam results in your room' : `submitted on ${todayDayName}`}
                            </span>
                        </div>
                        <div style={{ background: adminRole === 'avr' ? '#f0f9ff' : '#faf5ff', border: `1px solid ${adminRole === 'avr' ? '#bae6fd' : '#ddd6fe'}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Score</span>
                            <span style={{ fontSize: '28px', fontWeight: 800, color: singleRoomColor, lineHeight: 1 }}>
                                {avgScore}<span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>/{avgMax}</span>
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>average per examinee</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Male</span>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#0ea5e9', lineHeight: 1 }}>{maleCount}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{total > 0 ? Math.round((maleCount / total) * 100) : 0}% of {viewMode === 'today' ? 'today' : 'total'}</span>
                        </div>
                        <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Female</span>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#ec4899', lineHeight: 1 }}>{femaleCount}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{total > 0 ? Math.round((femaleCount / total) * 100) : 0}% of {viewMode === 'today' ? 'today' : 'total'}</span>
                        </div>
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pass Rate</span>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{passRate}%</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>≥50% score</span>
                        </div>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: singleRoomColor }} />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                                    {singleRoomLabel} — {viewMode === 'overall' ? 'All-time Results' : `Today (${todayDayName})`}
                                </span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {viewMode === 'today' ? 'Overall: ' : 'Total: '}
                                <strong style={{ color: '#0f172a' }}>
                                    {viewMode === 'today' ? allFiltered.length : total}
                                </strong>
                            </span>
                        </div>
                        <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
                            <div style={{
                                height: '100%',
                                width: viewMode === 'today' && allFiltered.length > 0
                                    ? `${Math.round((total / allFiltered.length) * 100)}%`
                                    : total > 0 ? '100%' : '0%',
                                background: singleRoomColor,
                                borderRadius: '99px',
                                transition: 'width 0.6s ease',
                            }} />
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Male', value: maleCount, color: '#0ea5e9' },
                                { label: 'Female', value: femaleCount, color: '#ec4899' },
                                { label: 'Avg Score', value: `${avgScore}/${avgMax}`, color: singleRoomColor },
                                { label: 'Pass Rate', value: `${passRate}%`, color: '#d97706' },
                                { label: viewMode === 'today' ? "Today's Total" : 'Total', value: total, color: '#16a34a' },
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>{item.label}:</span>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: item.color }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                        {total === 0 && (
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '10px 0 0' }}>
                                {viewMode === 'today' ? 'No results submitted today.' : 'No results found for this room yet.'}
                            </p>
                        )}
                    </div>
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
        boardPasser: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M8 14v7l4-2 4 2v-7" /><path d="m9 11 2 2 4-4" /></svg>,
        settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>,
        logout: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>,
        registerStudent: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg>,
        lock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
        info: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>,
        chevronRight: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
        shield: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
        user: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
        zap: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    };
    return icons[name] || null;
};

const availableCourses = [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Hospitality Management",
    "Bachelor of Secondary Education major in Filipino (BSED \u2013 Filipino)",
    "Bachelor of Secondary Education major in English (BSED \u2013 English)",
    "Bachelor of Secondary Education major in Mathematics (BSED \u2013 Math)",
    "Bachelor of Secondary Education major in Social Studies (BSED \u2013 Social Studies)",
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

    useEffect(() => { if (inputRefs.current[0]) inputRefs.current[0].focus(); }, []);

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
            if (digits[index]) { const newDigits = [...digits]; newDigits[index] = ''; setDigits(newDigits); setError(false); }
            else if (index > 0) { const newDigits = [...digits]; newDigits[index - 1] = ''; setDigits(newDigits); setError(false); inputRefs.current[index - 1].focus(); }
        } else if (e.key === 'Enter') { const pin = digits.join(''); if (pin.length === PIN_LENGTH) validatePin(pin); }
        else if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1].focus();
        else if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) inputRefs.current[index + 1].focus();
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
        if (pin === DEFAULT_PIN) { onSuccess(); }
        else {
            setError(true); setShake(true); setDigits(Array(PIN_LENGTH).fill(''));
            setTimeout(() => { setShake(false); if (inputRefs.current[0]) inputRefs.current[0].focus(); }, 600);
        }
    };

    const handleSubmit = () => { const pin = digits.join(''); if (pin.length === PIN_LENGTH) validatePin(pin); };
    const filled = digits.filter(d => d !== '').length;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6, 43, 20, 0.72)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <style>{`
                @keyframes pinShake { 0%,100%{transform:translateX(0)}15%{transform:translateX(-8px)}30%{transform:translateX(8px)}45%{transform:translateX(-6px)}60%{transform:translateX(6px)}75%{transform:translateX(-3px)}90%{transform:translateX(3px)} }
                @keyframes pinFadeIn { from{opacity:0;transform:scale(0.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)} }
                .pin-digit-input{width:52px;height:60px;text-align:center;font-size:22px;font-weight:700;border-radius:12px;border:2px solid #e2e8f0;background:#f8fafb;color:#062b14;outline:none;transition:border-color 0.18s,box-shadow 0.18s,background 0.18s;font-family:'Courier New',monospace;caret-color:transparent;}
                .pin-digit-input:focus{border-color:#16a34a;background:#f0fdf4;box-shadow:0 0 0 3px rgba(22,163,74,0.18);}
                .pin-digit-input.pin-filled{border-color:#16a34a;background:#f0fdf4;color:#16a34a;}
                .pin-digit-input.pin-error{border-color:#ef4444!important;background:#fef2f2!important;color:#ef4444!important;box-shadow:0 0 0 3px rgba(239,68,68,0.15)!important;}
            `}</style>
            <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', overflow: 'hidden', animation: 'pinFadeIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                <div style={{ background: W.bgHeader, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="lock" /></div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Access Restricted</h2>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>Enter 6-digit PIN to continue</p>
                        </div>
                    </div>
                </div>
                <div style={{ padding: '36px 32px 32px' }}>
                    <p style={{ textAlign: 'center', fontSize: '13px', color: W.textMuted, margin: '0 0 28px' }}>This feature requires authorization.<br />Please enter the admin PIN to proceed.</p>
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
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
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

const ProfileDropdown = ({ onClose, adminLabel, adminRole, isSuperAdmin, avatarLogo, onAbout, onLogout }) => {
    const roleDisplay = isSuperAdmin ? 'JPCS President' : adminRole === 'avr' ? 'AVR Room Admin' : 'Computer Lab 2 Admin';
    const roomTag = isSuperAdmin ? null : adminRole === 'avr' ? 'AVR' : 'Computer Lab 2';

    const metaRows = [
        { label: 'Role', value: roleDisplay },
        { label: 'System', value: 'Entrance Exam Admin' },
        { label: 'Institution', value: 'Kolehiyo Ng Subic' },
        ...(roomTag ? [{ label: 'Room', value: roomTag }] : []),
    ];

    return (
        <>
            <style>{`
                .pd-overlay { position: fixed; inset: 0; z-index: 1200; background: transparent; }
                .pd-card { position: fixed; top: 78px; right: 28px; width: 300px; background: #ffffff; border-radius: 16px; border: 1px solid #e8edf2; box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06); overflow: hidden; z-index: 1201; }
                .pd-arrow { position: absolute; top: -7px; right: 36px; width: 14px; height: 14px; background: #ffffff; border-left: 1px solid #e8edf2; border-top: 1px solid #e8edf2; transform: rotate(45deg); border-radius: 2px 0 0 0; }
                .pd-header { padding: 18px 18px 16px; background: #f8fafb; border-bottom: 1px solid #edf2f7; display: flex; align-items: center; gap: 13px; }
                .pd-avatar { width: 46px; height: 46px; border-radius: 50%; overflow: hidden; border: 2px solid #e2e8f0; flex-shrink: 0; }
                .pd-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .pd-name { margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px; }
                .pd-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 99px; font-size: 10px; font-weight: 700; color: #16a34a; letter-spacing: 0.2px; }
                .pd-meta { padding: 4px 0; border-bottom: 1px solid #edf2f7; }
                .pd-meta-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 18px; gap: 12px; }
                .pd-meta-row + .pd-meta-row { border-top: 1px solid #f1f5f9; }
                .pd-meta-label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; }
                .pd-meta-value { font-size: 11.5px; font-weight: 600; color: #334155; text-align: right; }
                .pd-actions { padding: 6px 8px; border-bottom: 1px solid #edf2f7; }
                .pd-action-btn { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: transparent; border: none; border-radius: 10px; cursor: pointer; font-family: inherit; transition: background 0.15s; text-align: left; }
                .pd-action-btn:hover { background: #f8fafb; }
                .pd-action-btn.danger:hover { background: #fef2f2; }
                .pd-action-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .pd-action-icon.info-icon { background: #f0fdf4; color: #16a34a; }
                .pd-action-icon.danger-icon { background: #fef2f2; color: #ef4444; }
                .pd-action-text { flex: 1; font-size: 13px; font-weight: 600; color: #334155; }
                .pd-action-btn.danger .pd-action-text { color: #ef4444; }
                .pd-action-chevron { color: #cbd5e1; display: flex; align-items: center; }
                .pd-action-btn.danger .pd-action-chevron { color: #fca5a5; }
                .pd-footer { padding: 10px 8px 10px; }
                .pd-close-btn { width: 100%; padding: 9px; background: #f8fafb; border: 1px solid #e2e8f0; border-radius: 10px; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
                .pd-close-btn:hover { background: #f1f5f9; color: #334155; }
            `}</style>
            <div className="pd-overlay" onClick={onClose} />
            <div className="pd-card">
                <div className="pd-arrow" />
                <div className="pd-header">
                    <div className="pd-avatar"><img src={avatarLogo} alt="Admin" /></div>
                    <div>
                        <p className="pd-name">{adminLabel}</p>
                        <span className="pd-badge"><Icon name="shield" />{roleDisplay}</span>
                    </div>
                </div>
                <div className="pd-meta">
                    {metaRows.map(row => (
                        <div key={row.label} className="pd-meta-row">
                            <span className="pd-meta-label">{row.label}</span>
                            <span className="pd-meta-value">{row.value}</span>
                        </div>
                    ))}
                </div>
                <div className="pd-actions">
                    <button className="pd-action-btn" onClick={() => { onClose(); onAbout(); }}>
                        <span className="pd-action-icon info-icon"><Icon name="info" /></span>
                        <span className="pd-action-text">About This App</span>
                        <span className="pd-action-chevron"><Icon name="chevronRight" /></span>
                    </button>
                    <button className="pd-action-btn danger" onClick={() => { onClose(); onLogout(); }}>
                        <span className="pd-action-icon danger-icon"><Icon name="logout" /></span>
                        <span className="pd-action-text">Sign Out</span>
                        <span className="pd-action-chevron"><Icon name="chevronRight" /></span>
                    </button>
                </div>
                <div className="pd-footer">
                    <button className="pd-close-btn" onClick={onClose}>Dismiss</button>
                </div>
            </div>
        </>
    );
};

const AboutModal = ({ onClose }) => {
    const aboutRows = [
        { label: 'Created by', value: 'Jayvee Madriaga Nacino', accent: true },
        { label: 'Title', value: 'JPCS President' },
        { label: 'Organization', value: 'Junior Philippine Computer Society (JPCS)' },
        { label: 'Institution', value: 'Kolehiyo Ng Subic' },
    ];

    return (
        <>
            <style>{`
                .about-side-card { position: fixed; top: 78px; right: 340px; width: 320px; background: #ffffff; border-radius: 16px; border: 1px solid #e8edf2; box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06); overflow: hidden; z-index: 1202; }
                .about-card-header { padding: 22px 20px 18px; background: #f8fafb; border-bottom: 1px solid #edf2f7; display: flex; flex-direction: column; align-items: center; text-align: center; }
                .about-icon-wrap { width: 50px; height: 50px; border-radius: 14px; background: #f0fdf4; border: 1.5px solid #bbf7d0; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
                .about-title { margin: 0 0 3px; font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; }
                .about-subtitle { margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500; }
                .about-meta { padding: 4px 0; border-bottom: 1px solid #edf2f7; }
                .about-meta-row { display: flex; align-items: flex-start; justify-content: space-between; padding: 10px 20px; gap: 14px; }
                .about-meta-row + .about-meta-row { border-top: 1px solid #f1f5f9; }
                .about-meta-label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; padding-top: 1px; }
                .about-meta-value { font-size: 12px; font-weight: 600; color: #334155; text-align: right; }
                .about-meta-value.accent { color: #16a34a; font-weight: 700; }
                .about-footer { padding: 12px 14px; }
                .about-close-btn { width: 100%; padding: 10px; background: #062b14; border: none; border-radius: 10px; color: #ffffff; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; letter-spacing: 0.3px; transition: background 0.15s; }
                .about-close-btn:hover { background: #0c4222; }
            `}</style>
            <div className="about-side-card">
                <div className="about-card-header">
                    <div className="about-icon-wrap">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                    </div>
                    <p className="about-title">KNS Entrance Exam System</p>
                    <p className="about-subtitle">Kolehiyo Ng Subic — Admissions Platform</p>
                </div>
                <div className="about-meta">
                    {aboutRows.map(row => (
                        <div key={row.label} className="about-meta-row">
                            <span className="about-meta-label">{row.label}</span>
                            <span className={`about-meta-value${row.accent ? ' accent' : ''}`}>{row.value}</span>
                        </div>
                    ))}
                </div>
                <div className="about-footer">
                    <button className="about-close-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </>
    );
};

const QuickActionsDropdown = ({ onClose, onStudentCode, onNavigate }) => {
    const actions = [
        { label: 'Student Code', desc: 'Register & enter exam scores', icon: 'registerStudent', action: onStudentCode },
        { label: 'View Student List', desc: 'Browse all registered students', icon: 'students', action: () => onNavigate('STUDENT LIST') },
        { label: 'View Question Bank', desc: 'Manage exam questions', icon: 'questions', action: () => onNavigate('QUESTION BANK') },
        { label: 'View All Results', desc: 'See exam results & scores', icon: 'results', action: () => onNavigate('RESULTS') },
    ];

    return (
        <>
            <style>{`
                .qa-overlay { position: fixed; inset: 0; z-index: 900; background: transparent; }
                @keyframes qaDropIn { from{opacity:0;transform:translateY(-8px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)} }
                .qa-card {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    width: 280px;
                    background: #ffffff;
                    border-radius: 14px;
                    border: 1px solid #e8edf2;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06);
                    overflow: hidden;
                    z-index: 901;
                    animation: qaDropIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
                }
                .qa-arrow {
                    position: absolute;
                    top: -7px;
                    right: 24px;
                    width: 14px;
                    height: 14px;
                    background: #ffffff;
                    border-left: 1px solid #e8edf2;
                    border-top: 1px solid #e8edf2;
                    transform: rotate(45deg);
                    border-radius: 2px 0 0 0;
                }
                .qa-header { padding: 12px 16px 10px; background: #f8fafb; border-bottom: 1px solid #edf2f7; }
                .qa-header-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin: 0; }
                .qa-list { padding: 6px 8px 8px; display: flex; flex-direction: column; gap: 2px; }
                .qa-item { display: flex; align-items: center; gap: 10px; padding: 10px 10px; background: transparent; border: none; border-radius: 10px; cursor: pointer; font-family: inherit; transition: background 0.15s; text-align: left; width: 100%; }
                .qa-item:hover { background: #f0fdf4; }
                .qa-item-icon { width: 32px; height: 32px; border-radius: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #16a34a; }
                .qa-item-text { flex: 1; }
                .qa-item-label { font-size: 13px; font-weight: 600; color: #0f172a; display: block; line-height: 1.2; }
                .qa-item-desc { font-size: 11px; color: #94a3b8; display: block; margin-top: 1px; }
                .qa-item-chevron { color: #cbd5e1; display: flex; align-items: center; }
            `}</style>
            <div className="qa-overlay" onClick={onClose} />
            <div className="qa-card">
                <div className="qa-arrow" />
                <div className="qa-header">
                    <p className="qa-header-label">Quick Actions</p>
                </div>
                <div className="qa-list">
                    {actions.map(item => (
                        <button key={item.label} className="qa-item" onClick={() => { onClose(); item.action(); }}>
                            <span className="qa-item-icon"><Icon name={item.icon} /></span>
                            <span className="qa-item-text">
                                <span className="qa-item-label">{item.label}</span>
                                <span className="qa-item-desc">{item.desc}</span>
                            </span>
                            <span className="qa-item-chevron"><Icon name="chevronRight" /></span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

const StudentCodeModal = ({ onClose }) => {
    const [form, setForm] = useState({ name: '', dob: '', sex: '', contact: '', pob: '', address: '', firstCourse: '', secondCourse: '', lastSchool: '', lastSchoolAddress: '', transferee: false, transfereeCourse: '', guardian: '' });
    const [scores, setScores] = useState([]);
    const [subjectsLoading, setSubjectsLoading] = useState(true);
    const [subjectsError, setSubjectsError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const adminRole = localStorage.getItem("admin_role");

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                setSubjectsLoading(true); setSubjectsError(null);
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/subjects`);
                if (!res.ok) throw new Error('Failed to fetch subjects');
                const data = await res.json();
                setScores(data.map(s => ({ subjectId: s._id, subject: s.name, score: 0, total: 20 })));
            } catch (err) { setSubjectsError(err.message); }
            finally { setSubjectsLoading(false); }
        };
        fetchSubjects();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'secondCourse' && value !== '' && value === form.firstCourse) { Swal.fire({ icon: 'warning', title: 'Duplicate Course Selection', text: 'Your 2nd course choice must be different from your 1st course choice.', confirmButtonText: 'OK', confirmButtonColor: '#16a34a' }); return; }
        if (name === 'firstCourse' && value !== '' && value === form.secondCourse) { Swal.fire({ icon: 'warning', title: 'Duplicate Course Selection', text: 'Your 1st course choice must be different from your 2nd course choice.', confirmButtonText: 'OK', confirmButtonColor: '#16a34a' }); return; }
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleScoreChange = (i, val) => { setScores(prev => prev.map((s, idx) => idx === i ? { ...s, score: Math.min(s.total, Math.max(0, Number(val))) } : s)); };

    const handleSubmit = async () => {
        setSaving(true); setSaveError(null);
        try {
            const userRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, dob: form.dob, sex: form.sex, contact: form.contact, pob: form.pob, address: form.address, firstCourse: form.firstCourse, secondCourse: form.secondCourse, lastSchool: form.lastSchool, lastSchoolAddress: form.lastSchoolAddress, transferee: form.transferee, transfereeCourse: form.transfereeCourse, guardian: form.guardian, room: adminRole === 'superadmin' ? 'avr' : adminRole }) });
            if (!userRes.ok) { const errData = await userRes.json(); throw new Error(errData.error || 'Failed to register student'); }
            const userData = await userRes.json();
            const userId = userData.user._id;
            const totalScore = scores.reduce((a, s) => a + s.score, 0);
            const totalQuestions = scores.reduce((a, s) => a + s.total, 0);
            const resultRes = await fetch(`${import.meta.env.VITE_API_URL}/api/results/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, answers: [], score: totalScore, totalQuestions, subjectScores: scores.map(s => ({ subject: s.subject, score: s.score, total: s.total })) }) });
            if (!resultRes.ok) { const errData = await resultRes.json(); throw new Error(errData.error || 'Failed to save result'); }
            setSaveSuccess(true);
            setTimeout(() => onClose(), 1500);
        } catch (err) { setSaveError(err.message); }
        finally { setSaving(false); }
    };

    const totalScore = scores.reduce((a, s) => a + s.score, 0);
    const totalMax = scores.reduce((a, s) => a + s.total, 0);
    const canSubmit = !subjectsLoading && !subjectsError && !saving && !saveSuccess && form.name && form.dob && form.sex && form.contact && form.address && form.firstCourse && form.lastSchool && form.guardian;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            <div style={{ background: W.bg, borderRadius: '16px', width: '100%', maxWidth: '1100px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px', background: W.bgHeader, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: W.bgSection, borderRadius: '8px', border: `1px solid ${W.border}`, cursor: 'pointer', marginTop: '4px' }} onClick={() => setForm(p => ({ ...p, transferee: !p.transferee }))}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${form.transferee ? W.accent : W.borderInput}`, background: form.transferee ? W.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                                    {form.transferee && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                                <label style={{ fontSize: '13px', color: W.textMuted, cursor: 'pointer', userSelect: 'none' }}>I am a Transferee</label>
                            </div>
                            {form.transferee && (<SCField label="Previous Course Taken *"><SCInput name="transfereeCourse" placeholder="Course Name" value={form.transfereeCourse} onChange={handleChange} required /></SCField>)}
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
                                                    <input type="number" value={s.score} min={0} max={s.total} onChange={e => handleScoreChange(i, e.target.value)} style={{ width: '64px', padding: '6px 10px', textAlign: 'center', background: W.accentBg, border: `1px solid ${W.accent}`, borderRadius: '8px', color: W.accent, fontSize: '14px', fontWeight: 700, outline: 'none', fontFamily: 'inherit' }} />
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
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);

    useEffect(() => { document.title = "Admin Dashboard"; }, []);

    const adminRole = localStorage.getItem("admin_role");
    const adminLabel = localStorage.getItem("admin_label");
    const isSuperAdmin = adminRole === 'superadmin';
    const requiresPin = adminRole === 'avr' || adminRole === 'comlab-2';

    const allMenuItems = [
        { name: 'DASHBOARD', id: 'dashboard' },
        { name: 'ROOMS DATA', id: 'examSettings' },
        { name: 'STUDENT LIST', id: 'students' },
        { name: 'REGISTER STUDENT', id: 'registerStudent' },
        { name: 'QUESTION BANK', id: 'questions' },
        { name: 'BOARD PASSER', id: 'boardPasser' },
        { name: 'RESULTS', id: 'results' },
        { name: 'SETTINGS', id: 'settings' },
    ];

    const restrictedMenuItems = [
        { name: 'DASHBOARD', id: 'dashboard' },
        { name: 'STUDENT LIST', id: 'students' },
        { name: 'QUESTION BANK', id: 'questions' },
        { name: 'BOARD PASSER', id: 'boardPasser' },
        { name: 'RESULTS', id: 'results' },
        { name: 'REGISTER STUDENT', id: 'registerStudent' },
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
            case 'BOARD PASSER': return <BoardPasserPage />;
            case 'QUESTION BANK': return <QuestionsPage />;
            case 'RESULTS': return <ResultsPage />;
            case 'REGISTER STUDENT': return <RegistersPage />;
            case 'STUDENT LIST': return <StudentListPage />;
            case 'ROOMS DATA': return <RoomsData />;
            case 'SETTINGS': return <SettingsPage />;
            case 'DASHBOARD':
                return (
                    <div className="kns-content-inner">
                        <div className="kns-welcome-banner">
                            <div className="kns-banner-left">
                                <h1>Entrance Exam Management</h1>
                                <p>
                                    {adminRole === 'avr' ? 'Welcome, AVR Admin!' : adminRole === 'comlab-2' ? 'Welcome, Comlab Admin!' : 'Welcome, Jayvee Madriaga Nacino | JPCS Admin!'}
                                </p>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <button
                                    className="kns-quick-actions-btn"
                                    onClick={() => setQuickActionsOpen(o => !o)}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Icon name="zap" />
                                        Quick Actions
                                    </span>
                                    <svg
                                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                        style={{ transform: quickActionsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                {quickActionsOpen && (
                                    <QuickActionsDropdown
                                        onClose={() => setQuickActionsOpen(false)}
                                        onStudentCode={handleStudentCodeClick}
                                        onNavigate={(tab) => { setActiveTab(tab); setQuickActionsOpen(false); }}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="kns-dashboard-grid">
                            <div className="kns-activity-panel">
                                <div className="kns-panel-header"><h3>Operational Overview</h3></div>
                                <OperationalOverview />
                            </div>
                            <div className="kns-dept-panel">
                                <div className="kns-panel-header"><h3>Department Breakdown</h3></div>
                                <DeptBarGraphPanel />
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
            </aside>

            <main className="kns-main-viewport">
                <header className="kns-topbar">
                    <div className="kns-search-wrapper" />
                    <div className="kns-admin-profile">
                        <button
                            className="kns-profile-pill-btn"
                            onClick={() => setModalState(modalState === 'profile' ? null : 'profile')}
                            title="View Profile"
                        >
                            <div className="kns-profile-pill-avatar">
                                <img src={avatarLogo} alt="Admin Avatar" />
                            </div>
                            <div className="kns-profile-pill-text">
                                <span className="kns-profile-pill-name">{adminLabel}</span>
                                <span className="kns-profile-pill-role">{isSuperAdmin ? 'JPCS President' : 'Room Admin'}</span>
                            </div>
                            <div className="kns-profile-pill-chevron">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: modalState === 'profile' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: '#94a3b8' }}>
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </header>
                <section className="kns-dynamic-content">
                    {renderMainContent()}
                </section>
            </main>

            {modalState === 'pin' && <PinGateModal onSuccess={handlePinSuccess} onClose={handleCloseAll} />}
            {modalState === 'studentCode' && <StudentCodeModal onClose={handleCloseAll} />}
            {modalState === 'profile' && (
                <ProfileDropdown
                    onClose={handleCloseAll}
                    adminLabel={adminLabel}
                    adminRole={adminRole}
                    isSuperAdmin={isSuperAdmin}
                    avatarLogo={avatarLogo}
                    onAbout={() => setModalState('about')}
                    onLogout={handleLogout}
                />
            )}
            {modalState === 'about' && (
                <>
                    <ProfileDropdown
                        onClose={handleCloseAll}
                        adminLabel={adminLabel}
                        adminRole={adminRole}
                        isSuperAdmin={isSuperAdmin}
                        avatarLogo={avatarLogo}
                        onAbout={() => setModalState('about')}
                        onLogout={handleLogout}
                    />
                    <AboutModal onClose={() => setModalState('profile')} />
                </>
            )}
        </div>
    );
}

function DeptBarGraphPanel() {
    const [enrichedResults, setEnrichedResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const adminRole = localStorage.getItem("admin_role");
    const isSuperAdmin = adminRole === 'superadmin';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resultsRes, usersRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/all-results`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/users`)
                ]);
                if (!resultsRes.ok || !usersRes.ok) throw new Error();
                const resultsData = await resultsRes.json();
                const usersData = await usersRes.json();
                const userMap = {};
                usersData.forEach(u => { userMap[u._id] = u; });
                const merged = resultsData.map(r => {
                    const user = userMap[r.userId?._id || r.userId] || {};
                    return { room: user.room || '—', firstCourse: user.firstCourse || '' };
                });
                setEnrichedResults(merged);
            } catch {
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <SkeletonBlock width="60%" height="12px" />
                        <SkeletonBlock width="100%" height="10px" radius="99px" />
                    </div>
                ))}
            </div>
        );
    }

    const activeResults = isSuperAdmin ? enrichedResults : enrichedResults.filter(r => r.room === adminRole);
    return <DeptBarGraph results={activeResults} />;
}