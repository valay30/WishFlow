import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, FileDown, FileText, Table2, Check, QrCode, Image as ImageIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { useIsland } from '../context/IslandContext';
import { useSettings } from '../context/SettingsContext';
import IOSToggle from './IOSToggle';

const FOLDER_THEMES = {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    emerald: '#10b981',
    rose: '#f43f5e',
    orange: '#f97316',
    slate: '#64748b'
};

export default function ExportModal({ collection, items, onClose }) {
    const { showIsland } = useIsland();
    const { currency } = useSettings();
    const [format, setFormat] = useState('pdf'); // 'pdf' | 'csv' | 'notion'
    const [isExporting, setIsExporting] = useState(false);
    
    // PDF Options
    const [includeQr, setIncludeQr] = useState(true);
    const [showPrice, setShowPrice] = useState(true);
    const [customNote, setCustomNote] = useState('');
    
    const printRef = useRef(null);

    const fmt = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(n);

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet(collection.name.substring(0, 31) || 'Wishlist'); // Max 31 chars for tab name

            sheet.columns = [
                { header: 'Item Name', key: 'name', width: 30 },
                { header: 'Store', key: 'store', width: 20 },
                { header: 'Price', key: 'price', width: 15 },
                { header: 'Priority', key: 'priority', width: 15 },
                { header: 'URL', key: 'url', width: 40 },
                { header: 'Date Added', key: 'date', width: 15 },
                { header: 'Notes', key: 'notes', width: 40 }
            ];

            const headerRow = sheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10367D' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

            items.forEach((item) => {
                const row = sheet.addRow({
                    name: item.name || '',
                    store: item.store || '',
                    price: item.price || 0,
                    priority: item.priority === 3 ? 'High' : item.priority === 2 ? 'Medium' : 'Low',
                    url: item.link || '',
                    date: item.created_at ? new Date(item.created_at) : new Date(),
                    notes: item.notes || ''
                });

                const priorityCell = row.getCell('priority');
                priorityCell.alignment = { horizontal: 'center' };
                if (item.priority === 3) {
                    priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD1D1' } };
                    priorityCell.font = { color: { argb: 'FF990000' }, bold: true };
                } else if (item.priority === 2) {
                    priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
                    priorityCell.font = { color: { argb: 'FFB38600' }, bold: true };
                } else {
                    priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
                    priorityCell.font = { color: { argb: 'FF38761D' }, bold: true };
                }

                row.getCell('price').numFmt = `"${currency || 'INR'} "#,##0.00`;
                row.getCell('date').numFmt = 'dd/mm/yyyy';
            });

            if (items.length > 0) {
                const lastRowIndex = items.length + 1;
                const sumRow = sheet.addRow({
                    name: 'TOTAL BUDGET:',
                    price: { formula: `SUM(C2:C${lastRowIndex})` }
                });
                
                sumRow.getCell('name').font = { bold: true };
                sumRow.getCell('name').alignment = { horizontal: 'right' };
                const sumPriceCell = sumRow.getCell('price');
                sumPriceCell.font = { bold: true };
                sumPriceCell.numFmt = `"${currency || 'INR'} "#,##0.00`;
                sumPriceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
            }

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const filename = `${collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_budget.xlsx`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showIsland({ title: 'Export Complete', subtitle: 'Excel workbook generated!', type: 'success' });
            onClose();
        } catch (error) {
            console.error('Excel Export Error:', error);
            showIsland({ title: 'Export Failed', subtitle: 'Could not generate Excel file', type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportNotion = async () => {
        try {
            const headers = '| Item Name | Store | Price | Priority | URL |\n|---|---|---|---|---|';
            const rows = items.map(item => 
                `| ${item.name || ''} | ${item.store || ''} | ${fmt(item.price || 0)} | ${item.priority || 1} | ${item.link || ''} |`
            ).join('\n');
            
            const markdown = `# ${collection.name}\n\n${headers}\n${rows}`;
            await navigator.clipboard.writeText(markdown);
            showIsland({ title: 'Copied to Clipboard', subtitle: 'Paste directly into Notion!', type: 'success' });
            onClose();
        } catch (error) {
            console.error('Notion Export Error:', error);
            showIsland({ title: 'Export Failed', subtitle: 'Could not generate Notion Markdown', type: 'error' });
        }
    };

    const handleExportPDF = async () => {
        if (items.length === 0) {
            showIsland({ title: 'No Items', subtitle: 'Collection is empty', type: 'error' });
            return;
        }

        setIsExporting(true);
        try {
            const element = printRef.current;
            element.style.display = 'block';
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pages = element.querySelectorAll('.pdf-page');
            
            for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                
                const canvas = await html2canvas(pages[i], {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    windowWidth: 800,
                    backgroundColor: '#ffffff'
                });
                
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }
            
            element.style.display = 'none';

            const filename = `${collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_guide.pdf`;
            pdf.save(filename);

            showIsland({ title: 'Export Complete', subtitle: 'PDF generated successfully!', type: 'success' });
            onClose();
        } catch (error) {
            console.error('PDF Export Error:', error);
            showIsland({ title: 'Export Failed', subtitle: 'Could not generate PDF', type: 'error' });
            if (printRef.current) printRef.current.style.display = 'none';
        } finally {
            setIsExporting(false);
        }
    };

    const handleExport = () => {
        if (format === 'excel') handleExportExcel();
        else if (format === 'notion') handleExportNotion();
        else handleExportPDF();
    };

    const themeColor = FOLDER_THEMES[collection.theme] || FOLDER_THEMES.orange;

    const coverPageCapacity = 6;
    const otherPageCapacity = 10;
    const chunks = [];
    if (items.length > 0) {
        chunks.push(items.slice(0, coverPageCapacity));
        let remaining = items.slice(coverPageCapacity);
        while(remaining.length > 0) {
            chunks.push(remaining.slice(0, otherPageCapacity));
            remaining = remaining.slice(otherPageCapacity);
        }
    } else {
        chunks.push([]);
    }

    return createPortal(
        <>
            <style>
                {`
                @keyframes exportFadeIn {
                    from { opacity: 0; backdrop-filter: blur(0px); }
                    to { opacity: 1; backdrop-filter: blur(8px); }
                }
                @keyframes exportSlideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .export-modal-container {
                    background: var(--surface);
                    border-radius: 24px;
                    width: 100%;
                    max-width: 420px;
                    max-height: 90vh;
                    overflow: hidden;
                    animation: exportSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    transition: max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .export-modal-body {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    overflow-y: auto;
                    flex: 1;
                }
                .export-modal-left {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    flex: 1;
                }
                .export-modal-right {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .preview-scale-wrapper {
                    width: 160px;
                    height: 226px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                    position: relative;
                    background: #fff;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .preview-scale-wrapper > div {
                    transform: scale(0.2);
                    transform-origin: top left;
                    position: absolute;
                    top: 0;
                    left: 0;
                    pointer-events: none;
                }
                
                @media (min-width: 768px) {
                    .export-modal-container.is-pdf {
                        max-width: 740px;
                    }
                    .export-modal-container.is-pdf .export-modal-body {
                        flex-direction: row;
                    }
                    .export-modal-container.is-pdf .export-modal-right {
                        width: 260px;
                        flex-shrink: 0;
                        border-left: 1px solid var(--border);
                        padding-left: 1.5rem;
                    }
                    .export-modal-container.is-pdf .preview-scale-wrapper {
                        width: 260px;
                        height: 367px;
                    }
                    .export-modal-container.is-pdf .preview-scale-wrapper > div {
                        transform: scale(0.325);
                    }
                }
                `}
            </style>
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
                animation: 'exportFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
            }} onClick={onClose}>
                <div className={`export-modal-container ${format === 'pdf' ? 'is-pdf' : ''}`} onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Export Collection</h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="export-modal-body">
                    <div className="export-modal-left">
                        {/* Format Selection */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Format
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                <FormatOption 
                                    icon={<FileText size={18} />} title="Styled PDF Guide" desc="Beautiful printable catalog"
                                    selected={format === 'pdf'} onClick={() => setFormat('pdf')}
                                />
                                <FormatOption 
                                    icon={<Table2 size={18} />} title="Advanced Excel" desc="Formulas & Styling"
                                    selected={format === 'excel'} onClick={() => setFormat('excel')}
                                />
                                <FormatOption 
                                    icon={<FileDown size={18} />} title="Notion Table" desc="Copy as Markdown"
                                    selected={format === 'notion'} onClick={() => setFormat('notion')}
                                />
                            </div>
                        </div>

                        {/* PDF Specific Options (Left Side) */}
                        {format === 'pdf' && (
                            <div style={{ animation: 'sc-fadeup 0.2s ease out', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Options
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <ToggleOption 
                                            icon={<QrCode size={16} />} title="Include QR Codes" 
                                            checked={includeQr} onChange={() => setIncludeQr(!includeQr)}
                                        />
                                        <ToggleOption 
                                            icon={<Table2 size={16} />} title="Show Prices" 
                                            checked={showPrice} onChange={() => setShowPrice(!showPrice)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Custom Note
                                    </label>
                                    <textarea
                                        value={customNote}
                                        onChange={(e) => setCustomNote(e.target.value)}
                                        placeholder="Add a personalized message to the cover page..."
                                        style={{
                                            width: '100%', padding: '0.85rem', borderRadius: '12px',
                                            border: '1px solid var(--border)', background: 'var(--bg)',
                                            color: 'var(--text)', fontSize: '0.9rem', resize: 'vertical',
                                            minHeight: '80px', fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PDF Preview (Right Side on Desktop) */}
                    {format === 'pdf' && (
                        <div className="export-modal-right" style={{ animation: 'sc-fadeup 0.2s ease out' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '100%', textAlign: 'left' }}>
                                Live Preview
                            </label>
                            <div className="preview-scale-wrapper">
                                <div>
                                    {chunks.length > 0 && (
                                        <PdfPage 
                                            chunk={chunks[0]} 
                                            pageIndex={0} 
                                            totalPages={chunks.length}
                                            collection={collection} 
                                            items={items} 
                                            showPrice={showPrice} 
                                            includeQr={includeQr} 
                                            themeColor={themeColor} 
                                            customNote={customNote}
                                            fmt={fmt}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        style={{
                            background: 'var(--primary)', color: '#fff', border: 'none',
                            padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700,
                            cursor: isExporting ? 'not-allowed' : 'pointer', opacity: isExporting ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        {isExporting ? 'Generating...' : (
                            <>
                                {format === 'notion' ? 'Copy to Clipboard' : 'Download'}
                                <FileDown size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Hidden PDF Printable Layout */}
            {format === 'pdf' && (
                <div style={{ overflow: 'hidden', height: 0, width: 0, position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
                    <div ref={printRef}>
                        {chunks.map((chunk, pageIndex) => (
                            <PdfPage 
                                key={pageIndex}
                                chunk={chunk} 
                                pageIndex={pageIndex} 
                                totalPages={chunks.length}
                                collection={collection} 
                                items={items} 
                                showPrice={showPrice} 
                                includeQr={includeQr} 
                                themeColor={themeColor} 
                                customNote={customNote}
                                fmt={fmt}
                            />
                        ))}
                    </div>
                </div>
            )}
            </div>
        </>,
        document.body
    );
}

function FormatOption({ icon, title, desc, selected, onClick }) {
    return (
        <div 
            onClick={onClick}
            style={{ 
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', 
                borderRadius: '12px', border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                background: selected ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                cursor: 'pointer', transition: 'all 0.2s'
            }}
        >
            <div style={{ color: selected ? 'var(--primary)' : 'var(--text-muted)' }}>{icon}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: selected ? 'var(--primary)' : 'var(--text)' }}>{title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</div>
            </div>
            {selected && <Check size={18} color="var(--primary)" />}
        </div>
    );
}

function ToggleOption({ icon, title, checked, onChange }) {
    return (
        <div onClick={onChange} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>{icon}</div>
            <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}>{title}</div>
            <div style={{ pointerEvents: 'none' }}>
                <IOSToggle checked={checked} />
            </div>
        </div>
    );
}

function PdfPage({ chunk, pageIndex, totalPages, collection, items, showPrice, includeQr, themeColor, customNote, fmt }) {
    return (
        <div className="pdf-page" style={{ 
            width: '800px', 
            minHeight: '1131px', 
            background: 'var(--surface)', 
            color: 'var(--text)', 
            padding: '40px', 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Cover Banner only on first page */}
            {pageIndex === 0 && (
                <div style={{ background: themeColor, borderRadius: '16px', padding: '40px', color: '#fff', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, paddingRight: '20px' }}>
                        <h1 style={{ margin: 0, fontSize: '3rem', fontWeight: 900, lineHeight: 1.1 }}>{collection.emoji} {collection.name}</h1>
                        <p style={{ margin: '10px 0 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
                            Gift Guide · {items.length} items {showPrice && `· ${fmt(items.reduce((acc, i) => acc + (i.price || 0), 0))} total`}
                        </p>
                        {customNote && (
                            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', fontSize: '1.1rem', fontStyle: 'italic', lineHeight: 1.4 }}>
                                "{customNote}"
                            </div>
                        )}
                    </div>
                    {includeQr && (
                        <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
                            <QRCodeSVG value={`${window.location.origin}/shared/collection/${collection.id}`} size={80} level="H" />
                        </div>
                    )}
                </div>
            )}

            {/* Items Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
                {chunk.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '20px', border: '1px solid var(--border)', padding: '20px', borderRadius: '16px' }}>
                        {/* Item Image */}
                        <div style={{ width: '100px', height: '100px', borderRadius: '12px', background: 'var(--surface-2)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.image ? (
                                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                            ) : (
                                <ImageIcon size={32} color="#ccc" />
                            )}
                        </div>
                        
                        {/* Item Details */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3 }}>
                                {item.name}
                            </h3>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '100px' }}>
                                    {item.store || 'Various'}
                                </span>
                                {showPrice && item.price > 0 && (
                                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: themeColor }}>
                                        {fmt(item.price)}
                                    </span>
                                )}
                            </div>
                            {item.notes && (
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    "{item.notes}"
                                </p>
                            )}
                        </div>

                        {/* Item QR */}
                        {includeQr && item.link && (
                            <div style={{ marginLeft: '10px', display: 'flex', alignItems: 'center' }}>
                                <div style={{ border: '1px solid var(--border)', padding: '5px', borderRadius: '8px' }}>
                                    <QRCodeSVG value={item.link} size={50} level="M" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {/* Footer */}
            {totalPages > 1 && (
                <div style={{ marginTop: 'auto', paddingTop: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 500 }}>
                    Page {pageIndex + 1} of {totalPages}
                </div>
            )}
        </div>
    );
}

