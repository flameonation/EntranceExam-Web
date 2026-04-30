import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { ArrowUpDown, FileDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign, PageOrientation
} from "docx";
import "./admincss/studentList.css";

export default function StudentListPage() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState("");
    const [exporting, setExporting] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: "submittedAt", direction: "desc" });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
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

        items.sort((a, b) => {
            let valA, valB;
            if (sortConfig.key === "name") {
                valA = a.userId?.name?.toLowerCase() || "";
                valB = b.userId?.name?.toLowerCase() || "";
            } else if (sortConfig.key === "score") {
                valA = a.score ?? 0;
                valB = b.score ?? 0;
            } else {
                valA = new Date(a[sortConfig.key]);
                valB = new Date(b[sortConfig.key]);
            }
            if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
        return items;
    }, [results, filterDate, sortConfig, adminRole, isSuperAdmin]);

    const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
    const paginatedResults = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedResults.slice(start, start + itemsPerPage);
    }, [sortedResults, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterDate, sortConfig]);

    const generateWordDocument = async () => {
        const headerBorder = { style: BorderStyle.SINGLE, size: 2, color: "0c4222" };

        const headerCell = (text, align = AlignmentType.CENTER) => new TableCell({
            borders: { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder },
            shading: { fill: "0c4222", type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
                alignment: align,
                children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18, font: "Calibri" })]
            })]
        });

        const dataCell = (text, bold = false, align = AlignmentType.LEFT) => new TableCell({
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" }
            },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
                alignment: align,
                children: [new TextRun({ text: String(text || ""), bold, size: 18, font: "Calibri" })]
            })]
        });

        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: { font: "Calibri", size: 18 }
                    }
                }
            },
            sections: [{
                properties: {
                    page: {
                        size: {
                            width: 12240,
                            height: 20160,
                            orientation: PageOrientation.PORTRAIT
                        },
                        margin: { top: 720, right: 720, bottom: 720, left: 720 }
                    }
                },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 60 },
                        children: [new TextRun({ text: "KOLEHIYO NG SUBIC", bold: true, size: 24, font: "Calibri" })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 60 },
                        children: [new TextRun({ text: "Subic, Zambales", size: 18, font: "Calibri" })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 60 },
                        children: [new TextRun({ text: "ENTRANCE EXAMINATION RESULTS", bold: true, size: 24, font: "Calibri" })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                        children: [new TextRun({
                            text: filterDate
                                ? `Date: ${new Date(filterDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
                                : `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
                            size: 18, font: "Calibri", color: "555555"
                        })]
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                tableHeader: true,
                                children: [
                                    headerCell("#", AlignmentType.CENTER),
                                    headerCell("STUDENT NAME", AlignmentType.LEFT),
                                    headerCell("DATE", AlignmentType.LEFT),
                                ]
                            }),
                            ...sortedResults.map((res, i) => new TableRow({
                                children: [
                                    dataCell(i + 1, false, AlignmentType.CENTER),
                                    dataCell(res.userId?.name || "Unknown", false, AlignmentType.LEFT),
                                    dataCell(new Date(res.submittedAt).toLocaleDateString("en-US", {
                                        year: "numeric", month: "short", day: "numeric"
                                    }), false, AlignmentType.LEFT),
                                ]
                            }))
                        ]
                    }),
                    new Paragraph({
                        spacing: { before: 240 },
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({
                            text: `Total Students: ${sortedResults.length}`,
                            bold: true, size: 18, font: "Calibri"
                        })]
                    })
                ]
            }]
        });

        const buffer = await Packer.toBlob(doc);
        const url = URL.createObjectURL(buffer);
        const a = document.createElement("a");
        a.href = url;
        const fileName = filterDate
            ? `ExamResults_${filterDate}.docx`
            : `ExamResults_All_${new Date().toISOString().split("T")[0]}.docx`;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);

        Swal.fire("Exported!", "Word document downloaded successfully.", "success");
    };

    const handleExportWord = async () => {
        if (sortedResults.length === 0) {
            Swal.fire("No Data", "There are no students to export.", "warning");
            return;
        }

        if (!filterDate) {
            const confirm = await Swal.fire({
                title: "Export All Students?",
                text: `Are you sure you want to export all ${sortedResults.length} students?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#0c4222",
                cancelButtonColor: "#718096",
                confirmButtonText: "Yes, export all",
                cancelButtonText: "Cancel"
            });

            if (!confirm.isConfirmed) {
                return;
            }
        }

        setExporting(true);

        try {
            await generateWordDocument();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to export Word document.", "error");
        } finally {
            setExporting(false);
        }
    };

    const roomLabel = adminRole === 'avr' ? 'AVR' : adminRole === 'comlab-2' ? 'Computer Laboratory 2' : null;

    const getPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="sl-page">
            <div className="sl-header">
                <div className="sl-header-info">
                    <h1>Student List</h1>
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
                <div className="sl-header-actions">
                    <div className="sl-filter-bar">
                        <label>Filter by Date:</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="sl-date-input"
                        />
                        {filterDate && (
                            <button className="sl-clear-btn" onClick={() => setFilterDate("")}>Clear</button>
                        )}
                    </div>
                    <button className="sl-export-btn" onClick={handleExportWord} disabled={exporting}>
                        <FileDown size={16} />
                        {exporting ? "Exporting..." : "Export to Word"}
                    </button>
                </div>
            </div>

            <div className="sl-list-container">
                {loading ? (
                    <div className="sl-empty-state">Loading students...</div>
                ) : sortedResults.length === 0 ? (
                    <div className="sl-empty-state">No students found{roomLabel ? ` for ${roomLabel}` : ""}.</div>
                ) : (
                    <div className="sl-table-wrapper">
                        <table className="sl-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "50px" }}>#</th>
                                    <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                                        NAME <ArrowUpDown size={13} style={{ marginLeft: 4 }} />
                                    </th>
                                    <th onClick={() => handleSort("submittedAt")} style={{ cursor: "pointer" }}>
                                        DATE <ArrowUpDown size={13} style={{ marginLeft: 4 }} />
                                    </th>
                                    <th onClick={() => handleSort("score")} style={{ cursor: "pointer" }}>
                                        SCORE <ArrowUpDown size={13} style={{ marginLeft: 4 }} />
                                    </th>
                                    <th>1ST CHOICE</th>
                                    <th>2ND CHOICE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedResults.map((res, index) => (
                                    <tr key={res._id} className="sl-row-hover">
                                        <td style={{ fontWeight: "bold", color: "#718096" }}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td className="sl-td-user">
                                            <span className="sl-user-name">{res.userId?.name || "Unknown"}</span>
                                            <span className="sl-user-sub">{res.userId?.email}</span>
                                        </td>
                                        <td className="sl-td-date">
                                            {new Date(res.submittedAt).toLocaleDateString("en-US", {
                                                year: "numeric", month: "short", day: "numeric"
                                            })}
                                            <br />
                                            <small style={{ color: "#a0aec0" }}>
                                                {new Date(res.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </small>
                                        </td>
                                        <td className="sl-td-bold">{res.score} / {res.totalQuestions}</td>
                                        <td className="sl-td-course">{res.userId?.firstCourse || "N/A"}</td>
                                        <td className="sl-td-course">{res.userId?.secondCourse || "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="sl-pagination">
                                <button
                                    className="sl-page-btn"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                {getPageNumbers().map(page => (
                                    <button
                                        key={page}
                                        className={`sl-page-btn ${page === currentPage ? 'sl-page-active' : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    className="sl-page-btn"
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
        </div>
    );
}