import React, { useState, useEffect } from 'react';
import './admincss/SettingsPage.css';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

const ToggleSwitch = ({ checked, onChange, disabled }) => (
    <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`settings-toggle ${checked ? 'settings-toggle-on' : ''} ${disabled ? 'settings-toggle-disabled' : ''}`}
    >
        <span className="settings-toggle-knob" />
    </button>
);

const SettingRow = ({ icon, title, description, children, locked }) => (
    <div className={`settings-row ${locked ? 'settings-row-locked' : ''}`}>
        <div className="settings-row-icon">{icon}</div>
        <div className="settings-row-info">
            <div className="settings-row-title">
                {title}
                {locked && (
                    <span className="settings-lock-badge">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        JPCS Only
                    </span>
                )}
            </div>
            <div className="settings-row-desc">{description}</div>
        </div>
        <div className="settings-row-control">{children}</div>
    </div>
);

const SectionCard = ({ title, subtitle, icon, children }) => (
    <div className="settings-card">
        <div className="settings-card-header">
            <div className="settings-card-header-icon">{icon}</div>
            <div>
                <div className="settings-card-title">{title}</div>
                {subtitle && <div className="settings-card-subtitle">{subtitle}</div>}
            </div>
        </div>
        <div className="settings-card-body">{children}</div>
    </div>
);

export default function SettingsPage() {
    const adminRole = localStorage.getItem('admin_role');
    const isSuperAdmin = adminRole === 'superadmin';

    const [boardPasserLocked, setBoardPasserLocked] = useState(false);
    const [loadingLock, setLoadingLock] = useState(true);

    const [examAccessOpen, setExamAccessOpen] = useState(() => localStorage.getItem('setting_exam_access') !== 'false');
    const [resultsVisible, setResultsVisible] = useState(() => localStorage.getItem('setting_results_visible') !== 'false');
    const [examTimerEnabled, setExamTimerEnabled] = useState(() => localStorage.getItem('setting_timer_enabled') !== 'false');
    const [examDuration, setExamDuration] = useState(() => parseInt(localStorage.getItem('setting_exam_duration') || '60'));
    const [announcementEnabled, setAnnouncementEnabled] = useState(() => localStorage.getItem('setting_announcement_enabled') === 'true');
    const [announcementText, setAnnouncementText] = useState(() => localStorage.getItem('setting_announcement_text') || '');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchLockStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/api/settings/boardpasser-lock`);
                if (res.ok) {
                    const data = await res.json();
                    setBoardPasserLocked(data.locked === true);
                }
            } catch {
                setBoardPasserLocked(false);
            } finally {
                setLoadingLock(false);
            }
        };
        fetchLockStatus();
    }, []);

    const handleBoardPasserLock = async (val) => {
        try {
            const res = await fetch(`${API_URL}/api/settings/boardpasser-lock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locked: val }),
            });
            if (!res.ok) throw new Error('Failed to save setting');
            setBoardPasserLocked(val);
            Swal.fire({
                icon: val ? 'warning' : 'success',
                title: val ? 'Board Passer Locked' : 'Board Passer Unlocked',
                text: val
                    ? 'AVR and Comlab admins can no longer access the Board Passer page.'
                    : 'Board Passer page is now accessible to all admins.',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update lock setting. Please try again.' });
        }
    };

    const handleExamAccess = (val) => {
        setExamAccessOpen(val);
        localStorage.setItem('setting_exam_access', val.toString());
    };

    const handleResultsVisible = (val) => {
        setResultsVisible(val);
        localStorage.setItem('setting_results_visible', val.toString());
    };

    const handleTimerEnabled = (val) => {
        setExamTimerEnabled(val);
        localStorage.setItem('setting_timer_enabled', val.toString());
    };

    const handleDurationChange = (val) => {
        const parsed = parseInt(val);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 300) setExamDuration(parsed);
    };

    const handleSaveDuration = () => {
        localStorage.setItem('setting_exam_duration', examDuration.toString());
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleAnnouncementToggle = (val) => {
        setAnnouncementEnabled(val);
        localStorage.setItem('setting_announcement_enabled', val.toString());
    };

    const handleAnnouncementSave = () => {
        localStorage.setItem('setting_announcement_text', announcementText);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        Swal.fire({ icon: 'success', title: 'Announcement saved!', timer: 1500, showConfirmButton: false });
    };

    const handleResetAll = async () => {
        const confirm = await Swal.fire({
            title: 'Reset All Settings?',
            text: 'This will restore all settings to their defaults.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, reset',
        });
        if (!confirm.isConfirmed) return;

        try {
            await fetch(`${API_URL}/api/settings/boardpasser-lock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locked: false }),
            });
        } catch {}

        localStorage.removeItem('setting_exam_access');
        localStorage.removeItem('setting_results_visible');
        localStorage.removeItem('setting_timer_enabled');
        localStorage.removeItem('setting_exam_duration');
        localStorage.removeItem('setting_announcement_enabled');
        localStorage.removeItem('setting_announcement_text');
        setBoardPasserLocked(false);
        setExamAccessOpen(true);
        setResultsVisible(true);
        setExamTimerEnabled(true);
        setExamDuration(60);
        setAnnouncementEnabled(false);
        setAnnouncementText('');
        Swal.fire({ icon: 'success', title: 'Settings reset!', timer: 1500, showConfirmButton: false });
    };

    return (
        <div className="settings-root">
            <div className="settings-header">
                <div className="settings-header-left">
                    <h1 className="settings-title">Settings</h1>
                    <p className="settings-subtitle">Manage system behavior and access controls</p>
                </div>
                {isSuperAdmin && (
                    <button className="settings-reset-btn" onClick={handleResetAll}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                            <path d="M3 3v5h5"/>
                        </svg>
                        Reset All
                    </button>
                )}
            </div>

            <div className="settings-grid">
                <SectionCard
                    title="Access Control"
                    subtitle="Control who can see what"
                    icon={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    }
                >
                    <SettingRow
                        locked={!isSuperAdmin}
                        icon={
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="6"/><path d="M8 14v7l4-2 4 2v-7"/><path d="m9 11 2 2 4-4"/>
                            </svg>
                        }
                        title="Lock Board Passer"
                        description={
                            loadingLock ? 'Loading...' :
                            boardPasserLocked
                                ? 'Board Passer is locked — AVR & Comlab admins cannot view it.'
                                : 'Board Passer is accessible to all admin roles.'
                        }
                    >
                        {isSuperAdmin ? (
                            <ToggleSwitch checked={boardPasserLocked} onChange={handleBoardPasserLock} disabled={loadingLock} />
                        ) : (
                            <div className="settings-padlock">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                            </div>
                        )}
                    </SettingRow>

                    <SettingRow
                        locked={!isSuperAdmin}
                        icon={
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                                <path d="M12 11h.01"/><path d="M12 16h.01"/>
                            </svg>
                        }
                        title="Results Visibility"
                        description={
                            resultsVisible
                                ? 'Exam results are visible to authorized admins.'
                                : 'Results page is currently hidden from room admins.'
                        }
                    >
                        {isSuperAdmin ? (
                            <ToggleSwitch checked={resultsVisible} onChange={handleResultsVisible} />
                        ) : (
                            <div className="settings-padlock">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                            </div>
                        )}
                    </SettingRow>

                    <SettingRow
                        icon={
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="4" rx="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                                <path d="m9 16 2 2 4-4"/>
                            </svg>
                        }
                        title="Exam Access"
                        description={
                            examAccessOpen
                                ? 'Students can currently register and take the exam.'
                                : 'Exam is closed — students cannot register or take the exam.'
                        }
                    >
                        <ToggleSwitch checked={examAccessOpen} onChange={handleExamAccess} disabled={!isSuperAdmin} />
                    </SettingRow>
                </SectionCard>

                <SectionCard
                    title="Exam Timer"
                    subtitle="Configure examination time limits"
                    icon={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                    }
                >
                    <SettingRow
                        locked={!isSuperAdmin}
                        icon={
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                        }
                        title="Enable Exam Timer"
                        description={
                            examTimerEnabled
                                ? 'Students are timed during the exam.'
                                : 'Timer is disabled — students have unlimited time.'
                        }
                    >
                        <ToggleSwitch checked={examTimerEnabled} onChange={handleTimerEnabled} disabled={!isSuperAdmin} />
                    </SettingRow>

                    {isSuperAdmin && (
                        <div className="settings-duration-row">
                            <div className="settings-duration-label">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                </svg>
                                Exam Duration (minutes)
                            </div>
                            <div className="settings-duration-controls">
                                <button className="settings-duration-btn" onClick={() => handleDurationChange(examDuration - 5)} disabled={examDuration <= 5}>−</button>
                                <input
                                    type="number"
                                    className="settings-duration-input"
                                    value={examDuration}
                                    min={1}
                                    max={300}
                                    onChange={e => handleDurationChange(e.target.value)}
                                />
                                <button className="settings-duration-btn" onClick={() => handleDurationChange(examDuration + 5)} disabled={examDuration >= 300}>+</button>
                                <button className="settings-save-duration" onClick={handleSaveDuration}>
                                    {saved ? '✓ Saved' : 'Save'}
                                </button>
                            </div>
                            <div className="settings-duration-hint">
                                Current: <strong>{examDuration} min</strong> ({Math.floor(examDuration / 60) > 0 ? `${Math.floor(examDuration / 60)}h ` : ''}{examDuration % 60 > 0 ? `${examDuration % 60}m` : ''})
                            </div>
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    title="Announcement Banner"
                    subtitle="Show a notice on the exam registration page"
                    icon={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    }
                >
                    <SettingRow
                        icon={
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        }
                        title="Show Announcement"
                        description={
                            announcementEnabled
                                ? 'Announcement banner is visible on the registration page.'
                                : 'Announcement banner is hidden.'
                        }
                    >
                        <ToggleSwitch checked={announcementEnabled} onChange={handleAnnouncementToggle} />
                    </SettingRow>

                    {announcementEnabled && (
                        <div className="settings-announcement-area">
                            <textarea
                                className="settings-announcement-input"
                                placeholder="Type your announcement here… e.g. 'Exam will start at 8:00 AM sharp.'"
                                value={announcementText}
                                onChange={e => setAnnouncementText(e.target.value)}
                                rows={3}
                            />
                            <button className="settings-announcement-save" onClick={handleAnnouncementSave}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                    <polyline points="17 21 17 13 7 13 7 21"/>
                                    <polyline points="7 3 7 8 15 8"/>
                                </svg>
                                Save Announcement
                            </button>
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    title="System Info"
                    subtitle="Current session details"
                    icon={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                        </svg>
                    }
                >
                    <div className="settings-info-grid">
                        {[
                            { label: 'Admin Role', value: adminRole === 'superadmin' ? 'JPCS President (Super Admin)' : adminRole === 'avr' ? 'AVR Room Admin' : 'Comlab Room Admin' },
                            { label: 'Board Passer Status', value: loadingLock ? '...' : boardPasserLocked ? '🔒 Locked for room admins' : '🔓 Accessible to all admins' },
                            { label: 'Exam Access', value: examAccessOpen ? '✅ Open' : '🚫 Closed' },
                            { label: 'Timer', value: examTimerEnabled ? `✅ Enabled (${examDuration} min)` : '❌ Disabled' },
                            { label: 'Announcement', value: announcementEnabled ? '✅ Active' : '❌ Hidden' },
                        ].map(item => (
                            <div key={item.label} className="settings-info-row">
                                <span className="settings-info-label">{item.label}</span>
                                <span className="settings-info-value">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}