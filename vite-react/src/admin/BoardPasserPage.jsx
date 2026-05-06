import React, { useState, useEffect } from 'react';
import './admincss/BoardPasserPage.css';

const SCORE_BRACKETS = [
    { label: 'Board Course Passers', min: 60, max: Infinity, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeClass: 'bp-badge-board' },
    { label: 'Non-Board Course Passers', min: 50, max: 59, color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', badgeClass: 'bp-badge-nonboard' },
    { label: 'Waitlist', min: 0, max: 49, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', badgeClass: 'bp-badge-waitlist' },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function getBracket(score) {
    return SCORE_BRACKETS.find(b => score >= b.min && score <= b.max) || SCORE_BRACKETS[2];
}

function sortStudents(list, sortBy) {
    return [...list].sort((a, b) => {
        if (sortBy === 'az') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'za') return (b.name || '').localeCompare(a.name || '');
        if (sortBy === 'score_asc') return a.score - b.score;
        return b.score - a.score;
    });
}

function formatDatePH(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function toDateOnly(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 10);
}

function getHourSlot(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr).getHours();
}

function formatHourLabel(hour) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 === 0 ? 12 : hour % 12;
    const nextH = (hour + 1) % 12 === 0 ? 12 : (hour + 1) % 12;
    const nextAmpm = (hour + 1) >= 12 ? 'PM' : 'AM';
    return `${h}:00 ${ampm} – ${nextH}:00 ${nextAmpm}`;
}

let docxModule = null;
async function getDocx() {
    if (docxModule) return docxModule;
    docxModule = await import('https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm');
    return docxModule;
}

async function generateDocx({ groups, dateFilter, timeSlotFilter, viewMode, filtered, bracketFilter, letterFilter, accordionSort, sectionSorts }) {
    const docx = await getDocx();
    const {
        Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
        PageBreak, TabStopType,
    } = docx;

    const dateLine = dateFilter
        ? `Date of Examination: ${formatDatePH(dateFilter + 'T00:00:00')}`
        : `As of: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    const timePart = timeSlotFilter !== '' ? ` — ${formatHourLabel(Number(timeSlotFilter))}` : '';
    const fullDateLine = dateLine + timePart;
    const printedLine = `Printed: ${new Date().toLocaleString('en-PH')}`;

    const PAGE_WIDTH = 12240;
    const PAGE_HEIGHT = 20160;
    const MARGIN = 1080;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };
    const lightBorder = { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' };
    const darkBorder = { style: BorderStyle.SINGLE, size: 8, color: '062B14' };

    function makeHeader(titleText, titleColor) {
        const cleanColor = titleColor.replace('#', '');
        return [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40 },
                children: [new TextRun({ text: 'KOLEHIYO NG SUBIC', bold: true, size: 40, color: '062B14', font: 'Arial' })],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 80 },
                children: [new TextRun({ text: 'Office of the Registrar — Entrance Examination Results', size: 18, color: '475569', font: 'Arial' })],
            }),
            new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '16A34A', space: 4 } },
                spacing: { before: 60, after: 60 },
                children: [],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 40 },
                children: [new TextRun({ text: titleText, bold: true, size: 28, color: cleanColor, font: 'Arial' })],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 160 },
                children: [new TextRun({ text: fullDateLine, size: 18, color: '64748B', font: 'Arial' })],
            }),
        ];
    }

    function makeTable(students, showBracket) {
        const colWidths = showBracket
            ? [400, 1800, 1000, 2000, 2000, 700, 1580]
            : [400, 1900, 1100, 2200, 2200, 700, 500];

        const hdrLabels = showBracket
            ? ['#', 'Name', 'Reg No.', '1st Course Choice', '2nd Course Choice', 'Score', 'Bracket']
            : ['#', 'Name', 'Reg No.', '1st Course Choice', '2nd Course Choice', 'Score', ''];

        const SCORE_COL = 5;

        const headerRow = new TableRow({
            tableHeader: true,
            children: hdrLabels.map((text, i) => new TableCell({
                width: { size: colWidths[i], type: WidthType.DXA },
                shading: { fill: '062B14', type: ShadingType.CLEAR },
                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                    alignment: (i === 0 || i === SCORE_COL) ? AlignmentType.CENTER : AlignmentType.LEFT,
                    children: [new TextRun({ text, bold: true, size: 16, color: 'FFFFFF', font: 'Arial' })],
                })],
            })),
        });

        const dataRows = students.map((s, idx) => {
            const b = getBracket(s.score ?? 0);
            const fill = idx % 2 === 1 ? 'F8FAFB' : 'FFFFFF';
            const scoreColor = b.color.replace('#', '');
            const values = showBracket
                ? [String(idx + 1), s.name || '—', s.regNumber || '—', s.firstCourse || '—', s.secondCourse || '—', String(s.score ?? 0), b.label]
                : [String(idx + 1), s.name || '—', s.regNumber || '—', s.firstCourse || '—', s.secondCourse || '—', String(s.score ?? 0), ''];

            return new TableRow({
                children: values.map((text, i) => new TableCell({
                    width: { size: colWidths[i], type: WidthType.DXA },
                    shading: { fill, type: ShadingType.CLEAR },
                    borders: { top: lightBorder, bottom: lightBorder, left: noBorder, right: noBorder },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({
                        alignment: (i === 0 || i === SCORE_COL) ? AlignmentType.CENTER : AlignmentType.LEFT,
                        children: [new TextRun({
                            text,
                            size: i === SCORE_COL ? 22 : 18,
                            bold: i === SCORE_COL,
                            color: i === SCORE_COL ? scoreColor : i === 0 ? '94A3B8' : '0F172A',
                            font: 'Arial',
                        })],
                    })],
                })),
            });
        });

        const totalRow = new TableRow({
            children: [new TableCell({
                columnSpan: 7,
                width: { size: CONTENT_WIDTH, type: WidthType.DXA },
                shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                borders: { top: darkBorder, bottom: noBorder, left: noBorder, right: noBorder },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({
                        text: `Total: ${students.length} examinee${students.length !== 1 ? 's' : ''}`,
                        bold: true, size: 18, color: '062B14', font: 'Arial',
                    })],
                })],
            })],
        });

        return new Table({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            columnWidths: colWidths,
            rows: [headerRow, ...dataRows, totalRow],
        });
    }

    function makeFooter() {
        return new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0', space: 6 } },
            spacing: { before: 240, after: 0 },
            tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
            children: [
                new TextRun({ text: 'Kolehiyo Ng Subic — Entrance Examination Management System', size: 16, color: '94A3B8', font: 'Arial' }),
                new TextRun({ text: `\t${printedLine}`, size: 16, color: '94A3B8', font: 'Arial' }),
            ],
        });
    }

    const children = [];

    if (viewMode === 'accordion') {
        const nonEmpty = groups.filter(g => g.students.length > 0);
        nonEmpty.forEach((group, gi) => {
            if (gi > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
            children.push(...makeHeader(group.label, group.color));
            const sorted = sortStudents(group.students, sectionSorts[group.label] ?? accordionSort);
            children.push(makeTable(sorted, false));
            children.push(makeFooter());
        });
        if (nonEmpty.length === 0) {
            children.push(new Paragraph({ children: [new TextRun({ text: 'No examinees to export.', size: 20, font: 'Arial', color: '94A3B8' })] }));
        }
    } else {
        const titleLabel = bracketFilter === 'all' ? 'All Examinees' : bracketFilter;
        const letterPart = letterFilter !== 'all' ? ` — ${letterFilter}` : '';
        children.push(...makeHeader(titleLabel + letterPart, '#0F172A'));
        children.push(makeTable(filtered, true));
        children.push(makeFooter());
    }

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
                    margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
                },
            },
            children,
        }],
    });

    return Packer.toBlob(doc);
}

function BracketPage({ group, dateFilter, timeSlotFilter, isLast }) {
    if (group.students.length === 0) return null;
    return (
        <div className={`bp-print-page${isLast ? '' : ' bp-print-page-break'}`}>
            <div className="bp-print-header">
                <h1 className="bp-print-school">KOLEHIYO NG SUBIC</h1>
                <p className="bp-print-subtitle">Office of the Registrar — Entrance Examination Results</p>
                <div className="bp-print-divider" />
                <h2 className="bp-print-title" style={{ color: group.color }}>{group.label}</h2>
                <p className="bp-print-date">
                    {dateFilter ? `Date of Examination: ${formatDatePH(dateFilter)}` : `As of: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                    {timeSlotFilter !== '' ? ` — ${formatHourLabel(Number(timeSlotFilter))}` : ''}
                </p>
            </div>
            <table className="bp-print-table">
                <thead>
                    <tr>
                        <th className="bp-pt-num">#</th>
                        <th>Name</th>
                        <th>1st Course Choice</th>
                        <th>2nd Course Choice</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {group.students.map((s, idx) => (
                        <tr key={s._id || idx} className={idx % 2 === 0 ? '' : 'bp-pt-alt'}>
                            <td className="bp-pt-num">{idx + 1}</td>
                            <td className="bp-pt-name">{s.name}</td>
                            <td className="bp-pt-course">{s.firstCourse || '—'}</td>
                            <td className="bp-pt-course">{s.secondCourse || '—'}</td>
                            <td className="bp-pt-score" style={{ color: group.color }}>{s.score ?? 0}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr><td colSpan={6} className="bp-pt-foot">Total: {group.students.length} examinee{group.students.length !== 1 ? 's' : ''}</td></tr>
                </tfoot>
            </table>
            <div className="bp-print-footer">
                <p>Kolehiyo Ng Subic — Entrance Examination Management System</p>
                <p>Printed: {new Date().toLocaleString('en-PH')}</p>
            </div>
        </div>
    );
}

function AccordionPrintView({ groups, onClose, dateFilter, timeSlotFilter, onExportDocx, exporting, exportError }) {
    const nonEmptyGroups = groups.filter(g => g.students.length > 0);
    return (
        <div className="bp-print-overlay">
            <div className="bp-print-controls no-print">
                <button className="bp-print-btn" onClick={() => window.print()}>🖨 Print / Save as PDF</button>
                <button
                    className="bp-print-btn"
                    style={{ background: '#1d4ed8' }}
                    onClick={onExportDocx}
                    disabled={exporting}
                >
                    {exporting ? (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'bp-spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            Generating…
                        </>
                    ) : '📄 Export as Word'}
                </button>
                <button className="bp-print-close" onClick={onClose}>✕ Close</button>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginLeft: '8px' }}>
                    Each bracket prints on its own page(s)
                </span>
                {exportError && (
                    <span style={{ color: '#fca5a5', fontSize: '12px', marginLeft: '8px' }}>
                        Export failed: {exportError}
                    </span>
                )}
            </div>
            <div className="bp-print-pages-container">
                {nonEmptyGroups.map((group, gi) => (
                    <BracketPage
                        key={group.label}
                        group={group}
                        dateFilter={dateFilter}
                        timeSlotFilter={timeSlotFilter}
                        isLast={gi === nonEmptyGroups.length - 1}
                    />
                ))}
                {nonEmptyGroups.length === 0 && (
                    <div className="bp-print-doc" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        No examinees to print.
                    </div>
                )}
            </div>
        </div>
    );
}

function FlatPrintView({ students, bracketFilter, letterFilter, onClose, dateFilter, timeSlotFilter, onExportDocx, exporting, exportError }) {
    const filtered = students
        .filter(s => {
            const b = getBracket(s.score ?? 0);
            if (bracketFilter !== 'all' && b.label !== bracketFilter) return false;
            if (letterFilter !== 'all') {
                const first = (s.name || '').trim()[0]?.toUpperCase();
                if (first !== letterFilter) return false;
            }
            return true;
        })
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    return (
        <div className="bp-print-overlay">
            <div className="bp-print-controls no-print">
                <button className="bp-print-btn" onClick={() => window.print()}>🖨 Print / Save as PDF</button>
                <button
                    className="bp-print-btn"
                    style={{ background: '#1d4ed8' }}
                    onClick={onExportDocx}
                    disabled={exporting}
                >
                    {exporting ? (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'bp-spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            Generating…
                        </>
                    ) : '📄 Export as Word'}
                </button>
                <button className="bp-print-close" onClick={onClose}>✕ Close</button>
                {exportError && (
                    <span style={{ color: '#fca5a5', fontSize: '12px', marginLeft: '8px' }}>
                        Export failed: {exportError}
                    </span>
                )}
            </div>
            <div className="bp-print-doc">
                <div className="bp-print-header">
                    <h1 className="bp-print-school">KOLEHIYO NG SUBIC</h1>
                    <p className="bp-print-subtitle">Office of the Registrar — Entrance Examination Results</p>
                    <div className="bp-print-divider" />
                    <h2 className="bp-print-title">
                        {bracketFilter === 'all' ? 'All Examinees' : bracketFilter}
                        {letterFilter !== 'all' ? ` — ${letterFilter}` : ''}
                    </h2>
                    <p className="bp-print-date">
                        {dateFilter ? `Date of Examination: ${formatDatePH(dateFilter)}` : `As of: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                        {timeSlotFilter !== '' ? ` — ${formatHourLabel(Number(timeSlotFilter))}` : ''}
                    </p>
                </div>
                <table className="bp-print-table">
                    <thead>
                        <tr>
                            <th className="bp-pt-num">#</th>
                            <th>Name</th>
                            <th>1st Course Choice</th>
                            <th>2nd Course Choice</th>
                            <th>Score</th>
                            <th>Bracket</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((s, idx) => {
                            const b = getBracket(s.score ?? 0);
                            return (
                                <tr key={s._id || idx} className={idx % 2 === 0 ? '' : 'bp-pt-alt'}>
                                    <td className="bp-pt-num">{idx + 1}</td>
                                    <td className="bp-pt-name">{s.name}</td>
                                    <td className="bp-pt-course">{s.firstCourse || '—'}</td>
                                    <td className="bp-pt-course">{s.secondCourse || '—'}</td>
                                    <td className="bp-pt-score" style={{ color: b.color }}>{s.score ?? 0}</td>
                                    <td><span className={`bp-pt-badge ${b.badgeClass}`}>{b.label}</span></td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} className="bp-pt-empty">No records found.</td></tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr><td colSpan={7} className="bp-pt-foot">Total: {filtered.length} examinee{filtered.length !== 1 ? 's' : ''}</td></tr>
                    </tfoot>
                </table>
                <div className="bp-print-footer">
                    <p>Kolehiyo Ng Subic — Entrance Examination Management System</p>
                    <p>Printed: {new Date().toLocaleString('en-PH')}</p>
                </div>
            </div>
        </div>
    );
}

function AccordionSection({ bracket, students, globalSort, onSortChange }) {
    const [open, setOpen] = useState(true);
    const [localSort, setLocalSort] = useState(null);

    const activeSortBy = localSort ?? globalSort;
    const sorted = sortStudents(students, activeSortBy);

    const SORT_OPTIONS = [
        { value: 'score_desc', label: 'Score ↓' },
        { value: 'score_asc', label: 'Score ↑' },
        { value: 'az', label: 'A → Z' },
        { value: 'za', label: 'Z → A' },
    ];

    const handleLocalSort = (val) => {
        const newLocal = localSort === val ? null : val;
        setLocalSort(newLocal);
        if (onSortChange) onSortChange(bracket.label, newLocal ?? globalSort);
    };

    return (
        <div className={`bp-accordion-card ${open ? 'bp-accordion-open' : ''}`}
            style={{ '--ac': bracket.color, '--acbg': bracket.bg, '--acbdr': bracket.border }}>
            <button className="bp-accordion-header" onClick={() => setOpen(o => !o)}>
                <div className="bp-accordion-left">
                    <div className="bp-accordion-dot" style={{ background: bracket.color }} />
                    <span className="bp-accordion-label" style={{ color: bracket.color }}>{bracket.label}</span>
                    <span className="bp-accordion-count" style={{ background: bracket.bg, color: bracket.color, border: `1px solid ${bracket.border}` }}>
                        {students.length}
                    </span>
                </div>
                <div className="bp-accordion-right">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', flexShrink: 0 }}>
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </button>

            {open && (
                <div className="bp-accordion-body">
                    <div className="bp-accordion-sort-bar" onClick={e => e.stopPropagation()}>
                        <span className="bp-sort-label">Sort:</span>
                        {SORT_OPTIONS.map(opt => (
                            <button key={opt.value}
                                className={`bp-sort-btn ${activeSortBy === opt.value ? 'bp-sort-active' : ''}`}
                                style={activeSortBy === opt.value ? { background: bracket.color, color: '#fff', borderColor: bracket.color } : {}}
                                onClick={() => handleLocalSort(opt.value)}>
                                {opt.label}
                            </button>
                        ))}
                        {localSort && (
                            <button className="bp-sort-reset" onClick={() => {
                                setLocalSort(null);
                                if (onSortChange) onSortChange(bracket.label, globalSort);
                            }}>↩ Use global</button>
                        )}
                    </div>
                    {sorted.length === 0 ? (
                        <div className="bp-accordion-empty">No examinees in this bracket.</div>
                    ) : (
                        <table className="bp-table">
                            <thead>
                                <tr>
                                    {['#', 'Name', 'Reg No.', '1st Course Choice', '2nd Course Choice', 'Room', 'Score'].map(h => (
                                        <th key={h} style={{ textAlign: h === '#' || h === 'Score' ? 'center' : 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((r, idx) => (
                                    <tr key={r._id || idx} className="bp-row">
                                        <td className="bp-td-num">{idx + 1}</td>
                                        <td className="bp-td-name">
                                            <div className="bp-name-main">{r.name}</div>
                                            <div className="bp-name-sub">{r.sex}</div>
                                        </td>
                                        <td className="bp-td-reg">{r.regNumber || '—'}</td>
                                        <td className="bp-td-course">{r.firstCourse}</td>
                                        <td className="bp-td-course">{r.secondCourse || '—'}</td>
                                        <td className="bp-td-room">
                                            <span className={`bp-room-tag ${r.room === 'avr' ? 'bp-room-avr' : 'bp-room-comlab'}`}>
                                                {r.room === 'avr' ? 'AVR' : r.room === 'comlab-2' ? 'Lab 2' : r.room || '—'}
                                            </span>
                                        </td>
                                        <td className="bp-td-score">
                                            <span className="bp-score-pill" style={{ background: bracket.bg, color: bracket.color, border: `1px solid ${bracket.border}` }}>
                                                {r.score}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

export default function BoardPasserPage() {
    const adminRole = localStorage.getItem('admin_role');
    const isSuperAdmin = adminRole === 'superadmin';

    const [lockChecked, setLockChecked] = useState(false);
    const [boardPasserLocked, setBoardPasserLocked] = useState(false);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [bracketFilter, setBracketFilter] = useState('all');
    const [letterFilter, setLetterFilter] = useState('all');
    const [scoreMin, setScoreMin] = useState('');
    const [scoreMax, setScoreMax] = useState('');
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [timeSlotFilter, setTimeSlotFilter] = useState('');
    const [showPrint, setShowPrint] = useState(false);
    const [page, setPage] = useState(1);
    const [accordionSort, setAccordionSort] = useState('score_desc');
    const [sectionSorts, setSectionSorts] = useState({});
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState('');
    const PER_PAGE = 20;

    useEffect(() => {
        const checkLock = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/settings/boardpasser-lock`);
                if (res.ok) {
                    const data = await res.json();
                    setBoardPasserLocked(data.locked === true);
                }
            } catch {
                setBoardPasserLocked(false);
            } finally {
                setLockChecked(true);
            }
        };
        checkLock();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/all-results`);
                if (!res.ok) throw new Error('Failed to fetch data');
                const resultsData = await res.json();
                const merged = resultsData.map(r => ({
                    ...r,
                    name: r.userId?.name || '—',
                    regNumber: r.userId?.registerNumber || '—',
                    firstCourse: r.userId?.firstCourse || '—',
                    secondCourse: r.userId?.secondCourse || '—',
                    sex: r.userId?.sex || '—',
                    room: r.userId?.room || '—',
                    score: r.score ?? 0,
                    submittedAt: r.submittedAt || null,
                }));
                setResults(merged);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (!lockChecked) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '10px', color: '#94a3b8', fontSize: '13px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'bp-spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Checking access…
            </div>
        );
    }

    if (boardPasserLocked && !isSuperAdmin) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', color: '#94a3b8' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', margin: 0 }}>Board Passer is currently locked.</p>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Please contact the JPCS Admin to unlock access.</p>
            </div>
        );
    }

    const availableDates = [...new Set(
        results.map(r => toDateOnly(r.submittedAt)).filter(Boolean)
    )].sort((a, b) => b.localeCompare(a));

    const availableTimeSlots = [...new Set(
        results
            .filter(r => !dateFilter || toDateOnly(r.submittedAt) === dateFilter)
            .map(r => getHourSlot(r.submittedAt))
            .filter(h => h !== null)
    )].sort((a, b) => a - b);

    const roleFiltered = results.filter(r => isSuperAdmin || r.room === adminRole);

    const applyFilters = (list) => list.filter(r => {
        if (bracketFilter !== 'all' && getBracket(r.score).label !== bracketFilter) return false;
        if (letterFilter !== 'all' && (r.name || '').trim()[0]?.toUpperCase() !== letterFilter) return false;
        if (scoreMin !== '' && r.score < Number(scoreMin)) return false;
        if (scoreMax !== '' && r.score > Number(scoreMax)) return false;
        if (dateFilter && toDateOnly(r.submittedAt) !== dateFilter) return false;
        if (timeSlotFilter !== '' && getHourSlot(r.submittedAt) !== Number(timeSlotFilter)) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            if (
                !r.name?.toLowerCase().includes(q) &&
                !r.firstCourse?.toLowerCase().includes(q) &&
                !r.secondCourse?.toLowerCase().includes(q) &&
                !r.regNumber?.toLowerCase().includes(q) 
            ) return false;
        }
        return true;
    });

    const filtered = applyFilters(roleFiltered).sort((a, b) => b.score - a.score);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const counts = {
        board: roleFiltered.filter(r => r.score >= 60).length,
        nonBoard: roleFiltered.filter(r => r.score >= 50 && r.score <= 59).length,
        waitlist: roleFiltered.filter(r => r.score <= 49).length,
    };

    const accordionGroups = SCORE_BRACKETS.map(b => ({
        ...b,
        students: applyFilters(roleFiltered).filter(r => getBracket(r.score).label === b.label),
    }));

    const printGroups = accordionGroups.map(group => ({
        ...group,
        students: sortStudents(group.students, sectionSorts[group.label] ?? accordionSort),
    }));

    const handleSectionSortChange = (label, effectiveSort) => {
        setSectionSorts(prev => ({ ...prev, [label]: effectiveSort }));
    };

    const resetFilters = () => {
        setBracketFilter('all');
        setLetterFilter('all');
        setScoreMin('');
        setScoreMax('');
        setSearch('');
        setDateFilter('');
        setTimeSlotFilter('');
        setPage(1);
    };

    const handleExportDocx = async () => {
        setExporting(true);
        setExportError('');
        try {
            const blob = await generateDocx({
                groups: printGroups,
                dateFilter,
                timeSlotFilter,
                viewMode,
                filtered,
                bracketFilter,
                letterFilter,
                accordionSort,
                sectionSorts,
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const datePart = dateFilter ? `_${dateFilter}` : '';
            a.href = url;
            a.download = `BoardPassers${datePart}_${new Date().toISOString().slice(0, 10)}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error full:', err);
            setExportError(err?.message || String(err) || 'Unknown export error. Check browser console for details.');
        } finally {
            setExporting(false);
        }
    };

    if (showPrint && viewMode === 'accordion') {
        return (
            <AccordionPrintView
                groups={printGroups}
                onClose={() => { setShowPrint(false); setExportError(''); }}
                dateFilter={dateFilter}
                timeSlotFilter={timeSlotFilter}
                onExportDocx={handleExportDocx}
                exporting={exporting}
                exportError={exportError}
            />
        );
    }
    if (showPrint) {
        return (
            <FlatPrintView
                students={filtered}
                bracketFilter={bracketFilter}
                letterFilter={letterFilter}
                onClose={() => { setShowPrint(false); setExportError(''); }}
                dateFilter={dateFilter}
                timeSlotFilter={timeSlotFilter}
                onExportDocx={handleExportDocx}
                exporting={exporting}
                exportError={exportError}
            />
        );
    }

    return (
        <div className="bp-root">
            <div className="bp-header-strip">
                <div className="bp-header-left">
                    <h1 className="bp-title">Board Passers</h1>
                    <p className="bp-subtitle">Score-based examinee classification results</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div className="bp-view-toggle">
                        <button className={`bp-view-btn ${viewMode === 'table' ? 'bp-view-active' : ''}`} onClick={() => setViewMode('table')}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
                            </svg>
                            Table
                        </button>
                        <button className={`bp-view-btn ${viewMode === 'accordion' ? 'bp-view-active' : ''}`} onClick={() => setViewMode('accordion')}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="10" width="18" height="4" rx="1" /><rect x="3" y="16" width="18" height="4" rx="1" />
                            </svg>
                            Accordion
                        </button>
                    </div>
                    <button className="bp-export-btn" onClick={() => setShowPrint(true)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                        </svg>
                        Print / Export
                    </button>
                </div>
            </div>

            <div className="bp-stat-row">
                {[
                    { label: 'Board Course Passers', value: counts.board, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', key: 'Board Course Passers' },
                    { label: 'Non-Board Passers', value: counts.nonBoard, color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', key: 'Non-Board Course Passers' },
                    { label: 'Waitlist', value: counts.waitlist, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', key: 'Waitlist' },
                ].map(card => (
                    <button key={card.key}
                        className={`bp-stat-card ${bracketFilter === card.key && viewMode === 'table' ? 'bp-stat-active' : ''}`}
                        style={{ '--sc': card.color, '--scbg': card.bg, '--scbdr': card.border }}
                        onClick={() => {
                            if (viewMode === 'table') { setBracketFilter(bracketFilter === card.key ? 'all' : card.key); setPage(1); }
                        }}>
                        <span className="bp-stat-num" style={{ color: card.color }}>{card.value}</span>
                        <span className="bp-stat-lbl">{card.label}</span>
                        <div className="bp-stat-bar" style={{ background: card.border }}>
                            <div className="bp-stat-fill" style={{ width: roleFiltered.length > 0 ? `${Math.round((card.value / roleFiltered.length) * 100)}%` : '0%', background: card.color }} />
                        </div>
                    </button>
                ))}
            </div>

            <div className="bp-bracket-legend">
                <div className="bp-legend-item"><span className="bp-legend-dot" style={{ background: '#16a34a' }} />60 &amp; above — Board Course Passers</div>
                <div className="bp-legend-sep" />
                <div className="bp-legend-item"><span className="bp-legend-dot" style={{ background: '#0ea5e9' }} />50–59 — Non-Board Course Passers</div>
                <div className="bp-legend-sep" />
                <div className="bp-legend-item"><span className="bp-legend-dot" style={{ background: '#f59e0b' }} />49 &amp; below — Waitlist</div>
            </div>

            <div className="bp-date-filter-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="bp-sort-label">Date:</span>
                    <select className="bp-date-select" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setTimeSlotFilter(''); setPage(1); }}>
                        <option value="">All Dates</option>
                        {availableDates.map(d => (
                            <option key={d} value={d}>
                                {new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </option>
                        ))}
                    </select>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="bp-sort-label">Time Slot:</span>
                    <select
                        className="bp-date-select"
                        value={timeSlotFilter}
                        onChange={e => { setTimeSlotFilter(e.target.value); setPage(1); }}
                        disabled={availableTimeSlots.length === 0}>
                        <option value="">All Times</option>
                        {availableTimeSlots.map(h => (
                            <option key={h} value={h}>{formatHourLabel(h)}</option>
                        ))}
                    </select>
                    {(dateFilter || timeSlotFilter !== '') && (
                        <button className="bp-clear-btn" onClick={() => { setDateFilter(''); setTimeSlotFilter(''); setPage(1); }}>✕ Clear</button>
                    )}
                    {(dateFilter || timeSlotFilter !== '') && (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {filtered.length} examinee{filtered.length !== 1 ? 's' : ''}
                            {dateFilter ? ` on ${new Date(dateFilter + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}
                            {timeSlotFilter !== '' ? ` · ${formatHourLabel(Number(timeSlotFilter))}` : ''}
                        </span>
                    )}
                </div>
            </div>

            {loading && (
                <div className="bp-loading">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'bp-spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    Loading results…
                </div>
            )}

            {error && (
                <div className="bp-error">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                    {error}
                </div>
            )}

            {!loading && !error && viewMode === 'accordion' && (
                <div className="bp-accordion-list">
                    <div className="bp-accordion-global-sort">
                        <span className="bp-sort-label">Global sort:</span>
                        {[
                            { value: 'score_desc', label: 'Score ↓' },
                            { value: 'score_asc', label: 'Score ↑' },
                            { value: 'az', label: 'A → Z' },
                            { value: 'za', label: 'Z → A' },
                        ].map(opt => (
                            <button key={opt.value}
                                className={`bp-sort-btn ${accordionSort === opt.value ? 'bp-sort-active' : ''}`}
                                onClick={() => { setAccordionSort(opt.value); setSectionSorts({}); }}>
                                {opt.label}
                            </button>
                        ))}
                        <span className="bp-sort-hint">Each section can also be sorted independently.</span>
                    </div>
                    {accordionGroups.map(group => (
                        <AccordionSection
                            key={group.label}
                            bracket={group}
                            students={group.students}
                            globalSort={accordionSort}
                            onSortChange={handleSectionSortChange}
                        />
                    ))}
                </div>
            )}

            {!loading && !error && viewMode === 'table' && (
                <>
                    <div className="bp-filter-bar">
                        <div className="bp-search-wrap">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            <input className="bp-search" placeholder="Search name or course…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                        </div>
                        <div className="bp-score-range">
                            <input className="bp-range-input" type="number" placeholder="Min score" value={scoreMin} onChange={e => { setScoreMin(e.target.value); setPage(1); }} min="0" max="100" />
                            <span className="bp-range-sep">–</span>
                            <input className="bp-range-input" type="number" placeholder="Max score" value={scoreMax} onChange={e => { setScoreMax(e.target.value); setPage(1); }} min="0" max="100" />
                        </div>
                        {(bracketFilter !== 'all' || letterFilter !== 'all' || scoreMin !== '' || scoreMax !== '' || search || dateFilter || timeSlotFilter !== '') && (
                            <button className="bp-clear-btn" onClick={resetFilters}>✕ Clear all</button>
                        )}
                    </div>

                    <div className="bp-letter-bar">
                        <button className={`bp-letter-btn ${letterFilter === 'all' ? 'bp-letter-active' : ''}`} onClick={() => { setLetterFilter('all'); setPage(1); }}>ALL</button>
                        {ALPHABET.map(l => (
                            <button key={l} className={`bp-letter-btn ${letterFilter === l ? 'bp-letter-active' : ''}`} onClick={() => { setLetterFilter(l); setPage(1); }}>{l}</button>
                        ))}
                    </div>

                    <div className="bp-table-wrap">
                        <table className="bp-table">
                            <thead>
                                <tr>
                                    {['#', 'Name', 'Reg No.', '1st Course Choice', '2nd Course Choice', 'Room', 'Score', 'Bracket'].map(h => (
                                        <th key={h} style={{ textAlign: h === '#' || h === 'Score' ? 'center' : 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="bp-empty">
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                            No examinees found for this filter.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((r, idx) => {
                                        const b = getBracket(r.score);
                                        const rank = (page - 1) * PER_PAGE + idx + 1;
                                        return (
                                            <tr key={r._id || idx} className="bp-row">
                                                <td className="bp-td-num">{rank}</td>
                                                <td className="bp-td-name">
                                                    <div className="bp-name-main">{r.name}</div>
                                                    <div className="bp-name-sub">{r.sex}</div>
                                                </td>
                                                <td className="bp-td-reg">{r.regNumber || '—'}</td>
                                                <td className="bp-td-course">{r.firstCourse}</td>
                                                <td className="bp-td-course">{r.secondCourse || '—'}</td>
                                                <td className="bp-td-room">
                                                    <span className={`bp-room-tag ${r.room === 'avr' ? 'bp-room-avr' : 'bp-room-comlab'}`}>
                                                        {r.room === 'avr' ? 'AVR' : r.room === 'comlab-2' ? 'Lab 2' : r.room || '—'}
                                                    </span>
                                                </td>
                                                <td className="bp-td-score">
                                                    <span className="bp-score-pill" style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}` }}>{r.score}</span>
                                                </td>
                                                <td className="bp-td-bracket">
                                                    <span className={`bp-badge ${b.badgeClass}`}>{b.label}</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="bp-pagination">
                            <button className="bp-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                .reduce((acc, p, i, arr) => {
                                    if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) => p === '...'
                                    ? <span key={`e${i}`} className="bp-page-ellipsis">…</span>
                                    : <button key={p} className={`bp-page-btn ${page === p ? 'bp-page-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                                )}
                            <button className="bp-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                        </div>
                    )}
                    <div className="bp-results-count">
                        Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </div>
                </>
            )}
        </div>
    );
}