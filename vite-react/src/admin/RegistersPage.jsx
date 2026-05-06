import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import './admincss/RegistersPage.css';

const ROOMS = [
    { id: 'avr', label: 'AVR' },
    { id: 'comlab-2', label: 'Computer Lab 2' },
];

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
    accentBg: '#f0fdf4',
    textPrimary: '#0f172a',
    textMuted: '#64748b',
    textDim: '#94a3b8',
    danger: '#ef4444',
    dangerBg: '#fef2f2',
    dangerBorder: '#fecaca',
    warn: '#f59e0b',
    warnBg: '#fffbeb',
    warnBorder: '#fde68a',
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

function formatDate(dob) {
    if (!dob) return '—';
    return new Date(dob).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getAge(dob) {
    if (!dob) return '—';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

function normalizeName(name) {
    return (name || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function getScoreColor(score, total) {
    if (score == null || !total) return '#94a3b8';
    const pct = Math.round((score / total) * 100);
    if (pct >= 75) return '#16a34a';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
}

function ScoreBadge({ score, total }) {
    if (score == null) return <span className="rp-text-dim">—</span>;
    const pct = total ? Math.round((score / total) * 100) : 0;
    let cls = 'rp-score-badge';
    if (pct >= 75) cls += ' rp-score-pass';
    else if (pct >= 50) cls += ' rp-score-mid';
    else cls += ' rp-score-fail';
    return (
        <span className={cls}>
            {score}<span className="rp-score-total">/{total}</span>
        </span>
    );
}

function EditModal({ student, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: student.name || '',
        dob: student.dob ? new Date(student.dob).toISOString().slice(0, 10) : '',
        sex: student.sex || '',
        contact: student.contact || '',
        pob: student.pob || '',
        address: student.address || '',
        firstCourse: student.firstCourse || '',
        secondCourse: student.secondCourse || '',
        lastSchool: student.lastSchool || '',
        lastSchoolAddress: student.lastSchoolAddress || '',
        transferee: student.transferee || false,
        transfereeCourse: student.transfereeCourse || '',
        guardian: student.guardian || '',
        room: student.room || 'avr',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'secondCourse' && value !== '' && value === form.firstCourse) {
            Swal.fire({ icon: 'warning', title: 'Duplicate Course', text: '2nd course must differ from 1st.', confirmButtonColor: '#16a34a' });
            return;
        }
        if (name === 'firstCourse' && value !== '' && value === form.secondCourse) {
            Swal.fire({ icon: 'warning', title: 'Duplicate Course', text: '1st course must differ from 2nd.', confirmButtonColor: '#16a34a' });
            return;
        }
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async () => {
        if (!form.name || !form.dob || !form.sex || !form.contact || !form.address || !form.firstCourse || !form.lastSchool || !form.guardian) {
            setError('Please fill all required fields.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${student._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Update failed');
            onSaved(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <style>{`@keyframes reg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <div style={{ background: W.bg, borderRadius: '16px', width: '100%', maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px', background: W.bgHeader, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Edit Student Record</h2>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{student.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>×</button>
                </div>
                <div style={{ overflowY: 'auto', padding: '24px 28px', flex: 1 }}>
                    <SCSection title="Personal Information">
                        <SCField label="Full Name *"><SCInput name="name" value={form.name} onChange={handleChange} /></SCField>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <SCField label="Date of Birth *"><SCInput type="date" name="dob" value={form.dob} onChange={handleChange} /></SCField>
                            <SCField label="Sex *">
                                <SCSelect name="sex" value={form.sex} onChange={handleChange}>
                                    <option value="" disabled hidden>Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </SCSelect>
                            </SCField>
                            <SCField label="Contact *"><SCInput type="tel" name="contact" value={form.contact} onChange={handleChange} /></SCField>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <SCField label="Place of Birth"><SCInput name="pob" value={form.pob} onChange={handleChange} /></SCField>
                            <SCField label="Home Address *"><SCInput name="address" value={form.address} onChange={handleChange} /></SCField>
                        </div>
                    </SCSection>
                    <SCSection title="Course Preference">
                        <SCField label="1st Course *">
                            <SCSelect name="firstCourse" value={form.firstCourse} onChange={handleChange}>
                                <option value="" disabled hidden>Select</option>
                                {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
                            </SCSelect>
                        </SCField>
                        <SCField label="2nd Course">
                            <SCSelect name="secondCourse" value={form.secondCourse} onChange={handleChange}>
                                <option value="">None</option>
                                {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
                            </SCSelect>
                        </SCField>
                    </SCSection>
                    <SCSection title="Educational Background">
                        <SCField label="Last School *"><SCInput name="lastSchool" value={form.lastSchool} onChange={handleChange} /></SCField>
                        <SCField label="School Address"><SCInput name="lastSchoolAddress" value={form.lastSchoolAddress} onChange={handleChange} /></SCField>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: W.bgSection, borderRadius: '8px', border: `1px solid ${W.border}`, cursor: 'pointer' }}
                            onClick={() => setForm(p => ({ ...p, transferee: !p.transferee }))}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${form.transferee ? W.accent : W.borderInput}`, background: form.transferee ? W.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                                {form.transferee && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </div>
                            <label style={{ fontSize: '13px', color: W.textMuted, cursor: 'pointer', userSelect: 'none' }}>Transferee</label>
                        </div>
                        {form.transferee && <SCField label="Previous Course"><SCInput name="transfereeCourse" value={form.transfereeCourse} onChange={handleChange} /></SCField>}
                    </SCSection>
                    <SCSection title="Other">
                        <SCField label="Guardian *"><SCInput name="guardian" value={form.guardian} onChange={handleChange} /></SCField>
                        <SCField label="Room">
                            <SCSelect name="room" value={form.room} onChange={handleChange}>
                                {ROOMS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </SCSelect>
                        </SCField>
                    </SCSection>
                    {error && (
                        <div style={{ padding: '12px 16px', background: W.dangerBg, border: `1px solid ${W.dangerBorder}`, borderRadius: '8px', color: W.danger, fontSize: '13px', marginBottom: '12px' }}>{error}</div>
                    )}
                </div>
                <div style={{ padding: '16px 28px', borderTop: `1px solid ${W.border}`, display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', background: W.bg, border: `1px solid ${W.border}`, borderRadius: '8px', color: W.textMuted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={saving} style={{ padding: '10px 24px', background: saving ? W.bgSection : W.accent, border: `1px solid ${saving ? W.border : W.accent}`, borderRadius: '8px', color: saving ? W.textDim : '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {saving && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'reg-spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DetailModal({ student, result, onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: W.bg, borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px', background: W.bgHeader, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: student.sex === 'Male' ? 'rgba(14,165,233,0.2)' : 'rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${student.sex === 'Male' ? 'rgba(14,165,233,0.4)' : 'rgba(236,72,153,0.4)'}`, color: student.sex === 'Male' ? '#0ea5e9' : '#ec4899', fontSize: '16px', fontWeight: 700 }}>
                            {(student.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{student.name}</h2>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{student.firstCourse}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>×</button>
                </div>
                <div style={{ overflowY: 'auto', padding: '24px 28px', flex: 1 }}>
                    {[
                        ['Sex', student.sex],
                        ['Date of Birth', formatDate(student.dob)],
                        ['Age', getAge(student.dob)],
                        ['Place of Birth', student.pob || '—'],
                        ['Contact', student.contact],
                        ['Address', student.address],
                        ['1st Course', student.firstCourse],
                        ['2nd Course', student.secondCourse || '—'],
                        ['Last School', student.lastSchool],
                        ['School Address', student.lastSchoolAddress || '—'],
                        ['Transferee', student.transferee ? 'Yes' : 'No'],
                        student.transferee ? ['Previous Course', student.transfereeCourse || '—'] : null,
                        ['Guardian', student.guardian],
                        ['Room', student.room === 'avr' ? 'AVR' : student.room === 'comlab-2' ? 'Computer Lab 2' : student.room || '—'],
                        ['Exam Score', result ? `${result.score} / ${result.totalQuestions}` : '—'],
                        result ? ['Submitted At', new Date(result.submittedAt).toLocaleString('en-PH')] : null,
                    ].filter(Boolean).map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', padding: '10px 0', borderBottom: `1px solid ${W.border}` }}>
                            <span style={{ width: '140px', fontSize: '12px', fontWeight: 600, color: W.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px', flexShrink: 0 }}>{label}</span>
                            <span style={{ fontSize: '13px', color: W.textPrimary, fontWeight: 500 }}>{value}</span>
                        </div>
                    ))}
                </div>
                <div style={{ padding: '16px 28px', borderTop: `1px solid ${W.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', background: W.accent, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
                </div>
            </div>
        </div>
    );
}

const PER_PAGE = 20;

export default function RegistersPage() {
    const adminRole = localStorage.getItem('admin_role');
    const isSuperAdmin = adminRole === 'superadmin';

    const [students, setStudents] = useState([]);
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roomFilter, setRoomFilter] = useState('all');
    const [sexFilter, setSexFilter] = useState('all');
    const [transfereeFilter, setTransfereeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState('list');
    const [editStudent, setEditStudent] = useState(null);
    const [detailStudent, setDetailStudent] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [dupSort, setDupSort] = useState('name_az');

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const [usersRes, resultsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/users`),
                fetch(`${import.meta.env.VITE_API_URL}/api/results`),
            ]);
            if (!usersRes.ok) throw new Error('Failed to fetch students');
            const usersData = await usersRes.json();
            setStudents(usersData);
            if (resultsRes.ok) {
                const resultsData = await resultsRes.json();
                const map = {};
                resultsData.forEach(r => { map[r.userId] = r; });
                setResults(map);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const roleStudents = isSuperAdmin ? students : students.filter(s => s.room === adminRole);

    const duplicateNames = (() => {
        const nameCount = {};
        roleStudents.forEach(s => {
            const key = normalizeName(s.name);
            nameCount[key] = (nameCount[key] || 0) + 1;
        });
        return new Set(Object.keys(nameCount).filter(k => nameCount[k] > 1));
    })();

    const filtered = roleStudents.filter(s => {
        if (roomFilter !== 'all' && s.room !== roomFilter) return false;
        if (sexFilter !== 'all' && s.sex !== sexFilter) return false;
        if (transfereeFilter === 'yes' && !s.transferee) return false;
        if (transfereeFilter === 'no' && s.transferee) return false;
        if (viewMode === 'duplicates') {
            if (!duplicateNames.has(normalizeName(s.name))) return false;
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            return (
                s.name?.toLowerCase().includes(q) ||
                s.firstCourse?.toLowerCase().includes(q) ||
                s.lastSchool?.toLowerCase().includes(q) ||
                s.contact?.toLowerCase().includes(q) ||
                s.address?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const sortedFiltered = viewMode === 'duplicates' ? [...filtered].sort((a, b) => {
        const scoreA = results[a._id]?.score ?? results[a.userId]?.score ?? null;
        const scoreB = results[b._id]?.score ?? results[b.userId]?.score ?? null;
        if (dupSort === 'name_az') return (a.name || '').localeCompare(b.name || '');
        if (dupSort === 'name_za') return (b.name || '').localeCompare(a.name || '');
        if (dupSort === 'score_desc') return (scoreB ?? -1) - (scoreA ?? -1);
        if (dupSort === 'score_asc') return (scoreA ?? -1) - (scoreB ?? -1);
        return 0;
    }) : filtered;

    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PER_PAGE));
    const paginated = sortedFiltered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const getDuplicatesForName = (name) => {
        const key = normalizeName(name);
        return roleStudents
            .filter(s => normalizeName(s.name) === key)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    };

    const handleDeleteDuplicate = async (student) => {
        const dupsForName = getDuplicatesForName(student.name);
        const original = dupsForName[0];
        const isDup = student._id !== original._id;

        const result = await Swal.fire({
            title: isDup ? 'Delete Duplicate?' : 'Warning: Deleting Original',
            html: isDup
                ? `<div style="font-size:14px;color:#64748b;">This will permanently delete the <strong style="color:#f59e0b;">duplicate</strong> record of <strong style="color:#0f172a;">${student.name}</strong> and its exam results.</div>`
                : `<div style="font-size:14px;color:#64748b;">You are trying to delete the <strong style="color:#ef4444;">original</strong> record of <strong style="color:#0f172a;">${student.name}</strong>. Only duplicates (later registrations) should be deleted. Are you sure?</div>`,
            icon: isDup ? 'warning' : 'error',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
        });
        if (!result.isConfirmed) return;

        setDeleting(student._id);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${student._id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            setStudents(prev => prev.filter(s => s._id !== student._id));
            Swal.fire({ icon: 'success', title: 'Deleted', text: `${student.name} duplicate removed.`, confirmButtonColor: '#16a34a', timer: 2000, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#16a34a' });
        } finally {
            setDeleting(null);
        }
    };

    const handleDelete = async (student) => {
        const result = await Swal.fire({
            title: 'Delete Student?',
            html: `<div style="font-size:14px;color:#64748b;">This will permanently delete <strong style="color:#0f172a;">${student.name}</strong> and all associated exam results.</div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
        });
        if (!result.isConfirmed) return;
        setDeleting(student._id);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${student._id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            setStudents(prev => prev.filter(s => s._id !== student._id));
            Swal.fire({ icon: 'success', title: 'Deleted', text: `${student.name} has been removed.`, confirmButtonColor: '#16a34a', timer: 2000, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#16a34a' });
        } finally {
            setDeleting(null);
        }
    };

    const handleSaved = (updated) => {
        setStudents(prev => prev.map(s => s._id === updated._id ? updated : s));
        setEditStudent(null);
        Swal.fire({ icon: 'success', title: 'Updated', text: 'Student record updated.', confirmButtonColor: '#16a34a', timer: 1800, showConfirmButton: false });
    };

    const handleModeChange = (mode) => {
        setViewMode(mode);
        setPage(1);
    };

    const resetFilters = () => {
        setSearch('');
        setRoomFilter('all');
        setSexFilter('all');
        setTransfereeFilter('all');
        setPage(1);
    };

    const totalMale = roleStudents.filter(s => s.sex === 'Male').length;
    const totalFemale = roleStudents.filter(s => s.sex === 'Female').length;
    const totalTransferee = roleStudents.filter(s => s.transferee).length;
    const totalDuplicateGroups = duplicateNames.size;

    const isDuplicate = (s) => duplicateNames.has(normalizeName(s.name));

    const isOriginal = (s) => {
        const dupsForName = getDuplicatesForName(s.name);
        return dupsForName[0]?._id === s._id;
    };

    const statCards = [
        { label: 'Total', value: roleStudents.length, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
        { label: 'Male', value: totalMale, color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
        { label: 'Female', value: totalFemale, color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8' },
        { label: 'Transferee', value: totalTransferee, color: '#8b5cf6', bg: '#faf5ff', border: '#ddd6fe' },
        { label: 'Duplicate Names', value: totalDuplicateGroups, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    ];

    const DUP_SORT_OPTIONS = [
        { value: 'name_az', label: 'Name A→Z' },
        { value: 'name_za', label: 'Name Z→A' },
        { value: 'score_desc', label: 'Score ↓' },
        { value: 'score_asc', label: 'Score ↑' },
    ];

    return (
        <div className="rp-root">
            <div className="rp-header-strip">
                <div className="rp-header-left">
                    <h1 className="rp-title">Registered Students</h1>
                    <p className="rp-subtitle">
                        {isSuperAdmin ? 'All rooms — full student registry' : `Room: ${adminRole === 'avr' ? 'AVR' : 'Computer Lab 2'}`}
                    </p>
                </div>
                <button className="rp-refresh-btn" onClick={fetchStudents}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                    Refresh
                </button>
            </div>

            <div className="rp-stat-row">
                {statCards.map(card => (
                    <div key={card.label} className="rp-stat-card" style={{ '--sc': card.color, '--scbg': card.bg, '--scbdr': card.border }}>
                        <span className="rp-stat-lbl">{card.label}</span>
                        <span className="rp-stat-num">{card.value}</span>
                    </div>
                ))}
            </div>

            <div className="rp-toolbar">
                <div className="rp-tab-group">
                    <button
                        className={`rp-tab-btn ${viewMode === 'list' ? 'active-all' : ''}`}
                        onClick={() => handleModeChange('list')}
                    >
                        All Students
                    </button>
                    <button
                        className={`rp-tab-btn ${viewMode === 'duplicates' ? 'active-dup' : ''}`}
                        onClick={() => handleModeChange('duplicates')}
                    >
                        Duplicates ({duplicateNames.size})
                    </button>
                </div>

                <div className="rp-search-wrap">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        className="rp-search-input"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search name, course, school…"
                    />
                    {search && (
                        <button className="rp-search-clear" onClick={() => setSearch('')}>×</button>
                    )}
                </div>

                {isSuperAdmin && (
                    <select className="rp-filter-select" value={roomFilter} onChange={e => { setRoomFilter(e.target.value); setPage(1); }} style={{ minWidth: '140px' }}>
                        <option value="all">All Rooms</option>
                        {ROOMS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                )}

                <select className="rp-filter-select" value={sexFilter} onChange={e => { setSexFilter(e.target.value); setPage(1); }}>
                    <option value="all">All Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>

                <select className="rp-filter-select" value={transfereeFilter} onChange={e => { setTransfereeFilter(e.target.value); setPage(1); }} style={{ minWidth: '150px' }}>
                    <option value="all">All Types</option>
                    <option value="yes">Transferees Only</option>
                    <option value="no">Non-Transferees</option>
                </select>

                {(search || roomFilter !== 'all' || sexFilter !== 'all' || transfereeFilter !== 'all') && (
                    <button className="rp-clear-btn" onClick={resetFilters}>✕ Clear</button>
                )}
            </div>

            {viewMode === 'duplicates' && duplicateNames.size > 0 && (
                <div className="rp-dup-warning">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <path d="M12 9v4" /><path d="M12 17h.01" />
                    </svg>
                    <span>
                        {duplicateNames.size} duplicate name group{duplicateNames.size !== 1 ? 's' : ''} found ({filtered.length} records). The <strong>ORIGINAL</strong> is the first registration — only delete duplicates.
                    </span>
                </div>
            )}

            {viewMode === 'duplicates' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0 4px 0', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: W.textMuted, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Sort:</span>
                    {DUP_SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setDupSort(opt.value)}
                            style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                border: `1px solid ${dupSort === opt.value ? '#16a34a' : '#e2e8f0'}`,
                                background: dupSort === opt.value ? '#16a34a' : '#ffffff',
                                color: dupSort === opt.value ? '#ffffff' : '#64748b',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="rp-loading">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'rp-spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Loading students…
                </div>
            ) : error ? (
                <div className="rp-error">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                    {error}
                </div>
            ) : (
                <div className="rp-table-wrap">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="rp-table">
                            <thead>
                                <tr>
                                    <th className="center">#</th>
                                    <th className="left">Name</th>
                                    <th className="left">Sex</th>
                                    <th className="left">Age</th>
                                    <th className="left">1st Course</th>
                                    <th className="left">Room</th>
                                    <th className="left">Transferee</th>
                                    <th className="left">School</th>
                                    <th className="center">Score</th>
                                    <th className="center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={10}>
                                            <div className="rp-empty">
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                                </svg>
                                                No students found.
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginated.map((s, idx) => {
                                    const isDup = isDuplicate(s);
                                    const orig = isDup ? isOriginal(s) : false;
                                    const rank = (page - 1) * PER_PAGE + idx + 1;
                                    const result = results[s._id] || results[s.userId] || null;
                                    return (
                                        <tr key={s._id} className={`rp-row${isDup ? ' dup-row' : ''}`}>
                                            <td className="rp-td rp-td-num">{rank}</td>
                                            <td className="rp-td">
                                                <div className="rp-name-wrap">
                                                    <div className={`rp-avatar ${s.sex === 'Male' ? 'rp-avatar-male' : 'rp-avatar-female'}`}>
                                                        {(s.name || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="rp-name-main">
                                                            {s.name}
                                                            {isDup && (
                                                                <span
                                                                    className="rp-dup-badge"
                                                                    style={orig ? { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' } : {}}
                                                                >
                                                                    {orig ? 'ORIGINAL' : 'DUPLICATE'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="rp-name-sub">{s.contact}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="rp-td">
                                                <span className={s.sex === 'Male' ? 'rp-sex-male' : 'rp-sex-female'}>{s.sex}</span>
                                            </td>
                                            <td className="rp-td rp-text-muted">{getAge(s.dob)}</td>
                                            <td className="rp-td">
                                                <span className="rp-course-text">{s.firstCourse}</span>
                                            </td>
                                            <td className="rp-td">
                                                <span className={`rp-room-tag ${s.room === 'avr' ? 'rp-room-avr' : 'rp-room-comlab'}`}>
                                                    {s.room === 'avr' ? 'AVR' : s.room === 'comlab-2' ? 'Lab 2' : s.room || '—'}
                                                </span>
                                            </td>
                                            <td className="rp-td">
                                                {s.transferee
                                                    ? <span className="rp-transfer-tag">Yes</span>
                                                    : <span className="rp-text-dim">—</span>
                                                }
                                            </td>
                                            <td className="rp-td">
                                                <span className="rp-school-text">{s.lastSchool}</span>
                                            </td>
                                            <td className="rp-td" style={{ textAlign: 'center' }}>
                                                <ScoreBadge score={result?.score} total={result?.totalQuestions} />
                                            </td>
                                            <td className="rp-td">
                                                <div className="rp-actions">
                                                    <button className="rp-action-btn" onClick={() => setDetailStudent(s)} title="View Details">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                    <button className="rp-action-btn" onClick={() => setEditStudent(s)} title="Edit">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="rp-action-btn danger"
                                                        onClick={() => viewMode === 'duplicates' ? handleDeleteDuplicate(s) : handleDelete(s)}
                                                        disabled={deleting === s._id}
                                                        title={viewMode === 'duplicates' ? (orig ? 'Delete Original (caution)' : 'Delete Duplicate') : 'Delete'}
                                                    >
                                                        {deleting === s._id ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'rp-spin 1s linear infinite' }}>
                                                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                            </svg>
                                                        ) : (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                                <path d="M10 11v6" /><path d="M14 11v6" />
                                                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="rp-table-footer">
                        <span className="rp-results-count">
                            Showing {sortedFiltered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sortedFiltered.length)} of {sortedFiltered.length} student{sortedFiltered.length !== 1 ? 's' : ''}
                        </span>
                        {totalPages > 1 && (
                            <div className="rp-pagination">
                                <button className="rp-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                    .reduce((acc, p, i, arr) => {
                                        if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, i) => p === '...'
                                        ? <span key={`e${i}`} className="rp-page-ellipsis">…</span>
                                        : <button key={p} className={`rp-page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                                    )}
                                <button className="rp-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {editStudent && <EditModal student={editStudent} onClose={() => setEditStudent(null)} onSaved={handleSaved} />}
            {detailStudent && <DetailModal student={detailStudent} result={results[detailStudent._id] || null} onClose={() => setDetailStudent(null)} />}
        </div>
    );
}