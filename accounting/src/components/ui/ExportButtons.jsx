// src/components/ui/ExportButtons.jsx
import React from 'react';

const ExportButtons = ({
    data,
    filename = 'export',
    columns = [],
    title = '',
    includeDate = true,
    showCSV = true,
    showJSON = true,
    showPrint = true,
    showText = true
}) => {

    // تابع ایجاد CSV با پشتیبانی از UTF-8
    const exportToCSV = () => {
        if (!data || data.length === 0) {
            alert('داده‌ای برای ذخیره وجود ندارد');
            return;
        }

        try {
            // اضافه کردن BOM برای پشتیبانی از UTF-8
            let csvContent = '\uFEFF';

            // ایجاد هدر
            if (columns.length > 0) {
                csvContent += columns.map(col => `"${escapeCSV(col.header)}"`).join(",") + "\n";
            } else if (data[0]) {
                csvContent += Object.keys(data[0]).map(key => `"${escapeCSV(key)}"`).join(",") + "\n";
            }

            // اضافه کردن ردیف‌ها
            data.forEach(item => {
                let row;
                if (columns.length > 0) {
                    row = columns.map(col => {
                        let value = item[col.accessor];
                        if (col.format && typeof col.format === 'function') {
                            value = col.format(value);
                        }
                        return `"${escapeCSV(String(value || ''))}"`;
                    }).join(",");
                } else {
                    row = Object.values(item).map(value => {
                        return `"${escapeCSV(String(value || ''))}"`;
                    }).join(",");
                }
                csvContent += row + "\n";
            });

            downloadFile(csvContent, 'csv', 'text/csv;charset=utf-8');
            console.log('✅ فایل CSV با موفقیت ایجاد شد');
        } catch (error) {
            console.error('❌ خطا در ایجاد فایل CSV:', error);
            alert('خطا در ایجاد فایل CSV');
        }
    };

    // تابع ایجاد JSON
    const exportToJSON = () => {
        if (!data || data.length === 0) {
            alert('داده‌ای برای ذخیره وجود ندارد');
            return;
        }

        try {
            const jsonContent = JSON.stringify(data, null, 2);
            downloadFile(jsonContent, 'json', 'application/json');
            console.log('✅ فایل JSON با موفقیت ایجاد شد');
        } catch (error) {
            console.error('❌ خطا در ایجاد فایل JSON:', error);
            alert('خطا در ایجاد فایل JSON');
        }
    };

    // تابع چاپ گزارش
    const exportToPrint = () => {
        if (!data || data.length === 0) {
            alert('داده‌ای برای چاپ وجود ندارد');
            return;
        }

        // ایجاد محتوای HTML برای چاپ
        let printContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${title || 'گزارش'}</title>
                <style>
                    body {
                        font-family: Tahoma, Arial, sans-serif;
                        font-size: 12px;
                        margin: 20px;
                        line-height: 1.5;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 20px;
                        color: #2c3e50;
                    }
                    .info {
                        margin: 10px 0;
                        color: #666;
                        font-size: 11px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    th {
                        background-color: #f2f2f2;
                        border: 1px solid #ddd;
                        padding: 8px 12px;
                        text-align: right;
                        font-weight: bold;
                        font-size: 11px;
                    }
                    td {
                        border: 1px solid #ddd;
                        padding: 6px 10px;
                        text-align: right;
                        font-size: 11px;
                    }
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        font-size: 10px;
                        color: #666;
                        border-top: 1px solid #ddd;
                        padding-top: 10px;
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                        }
                        .no-print {
                            display: none !important;
                        }
                        table {
                            page-break-inside: auto;
                        }
                        tr {
                            page-break-inside: avoid;
                            page-break-after: auto;
                        }
                    }
                    @page {
                        margin: 15mm;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title || 'گزارش'}</h1>
                    <div class="info">
                        تعداد ردیف‌ها: ${data.length} ردیف | 
                        تاریخ استخراج: ${new Date().toLocaleDateString('fa-IR')} - 
                        ساعت: ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
        `;

        // اضافه کردن هدرهای جدول
        if (columns.length > 0) {
            columns.forEach(col => {
                printContent += `<th>${escapeHtml(col.header)}</th>`;
            });
        } else if (data[0]) {
            Object.keys(data[0]).forEach(key => {
                printContent += `<th>${escapeHtml(key)}</th>`;
            });
        }

        printContent += `
                        </tr>
                    </thead>
                    <tbody>
        `;

        // اضافه کردن داده‌ها
        data.forEach(item => {
            printContent += '<tr>';

            if (columns.length > 0) {
                columns.forEach(col => {
                    let value = item[col.accessor];
                    if (col.format && typeof col.format === 'function') {
                        value = col.format(value);
                    }
                    printContent += `<td>${escapeHtml(String(value || ''))}</td>`;
                });
            } else if (data[0]) {
                Object.values(item).forEach(value => {
                    printContent += `<td>${escapeHtml(String(value || ''))}</td>`;
                });
            }

            printContent += '</tr>';
        });

        printContent += `
                    </tbody>
                </table>
                
                <div class="footer">
                    <div>چاپ شده از سیستم حسابداری</div>
                    <div>تعداد کل ردیف‌ها: ${data.length} | تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</div>
                </div>
                
                <script>
                    // چاپ خودکار پس از لود صفحه
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            // بستن پنجره پس از چاپ
                            setTimeout(function() {
                                window.close();
                            }, 500);
                        }, 300);
                    };
                    
                    // پشتیبانی از کلیدهای میانبر
                    document.addEventListener('keydown', function(e) {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                            e.preventDefault();
                            window.print();
                        }
                        if (e.key === 'Escape') {
                            window.close();
                        }
                    });
                </script>
            </body>
            </html>
        `;

        // باز کردن پنجره جدید برای چاپ
        const printWindow = window.open('', '_blank', 'width=900,height=600');
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    // تابع ایجاد فایل متنی
    const exportToText = () => {
        if (!data || data.length === 0) {
            alert('داده‌ای برای ذخیره وجود ندارد');
            return;
        }

        try {
            let textContent = '';

            // اضافه کردن عنوان
            if (title) {
                textContent += title + '\n';
                textContent += '='.repeat(title.length) + '\n\n';
            }

            // اضافه کردن تاریخ
            if (includeDate) {
                const dateStr = new Date().toLocaleDateString('fa-IR');
                textContent += `تاریخ استخراج: ${dateStr}\n\n`;
            }

            // ایجاد جدول متنی
            if (columns.length > 0) {
                // محاسبه عرض ستون‌ها
                const colWidths = columns.map(col => {
                    const values = data.map(item => {
                        let value = item[col.accessor];
                        if (col.format && typeof col.format === 'function') {
                            value = col.format(value);
                        }
                        return String(value || '').length;
                    });
                    return Math.max(col.header.length, ...values);
                });

                // هدر
                const header = columns.map((col, i) =>
                    col.header.padEnd(colWidths[i] + 2)
                ).join(' | ');
                textContent += header + '\n';
                textContent += '-'.repeat(header.length) + '\n';

                // داده‌ها
                data.forEach(item => {
                    const row = columns.map((col, i) => {
                        let value = item[col.accessor];
                        if (col.format && typeof col.format === 'function') {
                            value = col.format(value);
                        }
                        return String(value || '').padEnd(colWidths[i] + 2);
                    }).join(' | ');
                    textContent += row + '\n';
                });
            } else if (data[0]) {
                const headers = Object.keys(data[0]);
                const colWidths = headers.map(header => {
                    const values = data.map(item => String(item[header] || '').length);
                    return Math.max(header.length, ...values);
                });

                // هدر
                const header = headers.map((h, i) =>
                    h.padEnd(colWidths[i] + 2)
                ).join(' | ');
                textContent += header + '\n';
                textContent += '-'.repeat(header.length) + '\n';

                // داده‌ها
                data.forEach(item => {
                    const row = headers.map((h, i) =>
                        String(item[h] || '').padEnd(colWidths[i] + 2)
                    ).join(' | ');
                    textContent += row + '\n';
                });
            }

            textContent += `\n\nتعداد ردیف‌ها: ${data.length}`;

            downloadFile(textContent, 'txt', 'text/plain;charset=utf-8');
            console.log('✅ فایل متنی با موفقیت ایجاد شد');
        } catch (error) {
            console.error('❌ خطا در ایجاد فایل متنی:', error);
            alert('خطا در ایجاد فایل متنی');
        }
    };

    // تابع کمکی برای escape کردن CSV
    const escapeCSV = (text) => {
        if (text === null || text === undefined) return '';
        return String(text).replace(/"/g, '""');
    };

    // تابع کمکی برای escape کردن HTML
    const escapeHtml = (text) => {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // تابع کمکی برای دانلود فایل
    const downloadFile = (content, extension, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.href = url;
        const dateStr = includeDate ? `_${new Date().toISOString().split('T')[0]}` : '';
        link.download = `${filename}${dateStr}.${extension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // استایل‌های دکمه‌ها
    const buttonStyles = {
        base: {
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            minWidth: '120px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontFamily: 'inherit'
        },
        csv: {
            backgroundColor: '#2196F3', // آبی
        },
        json: {
            backgroundColor: '#9C27B0', // بنفش
        },
        print: {
            backgroundColor: '#FF9800', // نارنجی
        },
        text: {
            backgroundColor: '#607D8B', // خاکستری آبی
        }
    };

    const hasData = data && data.length > 0;

    return (
        <div className="export-buttons-container" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            margin: '10px 0'
        }}>
            {showCSV && (
                <button
                    onClick={exportToCSV}
                    style={{ ...buttonStyles.base, ...buttonStyles.csv }}
                    title="دانلود فایل CSV (قابل باز کردن در Excel)"
                    disabled={!hasData}
                >
                    <span style={{ fontSize: '16px' }}>📊</span>
                    CSV
                </button>
            )}

            {showJSON && (
                <button
                    onClick={exportToJSON}
                    style={{ ...buttonStyles.base, ...buttonStyles.json }}
                    title="دانلود فایل JSON"
                    disabled={!hasData}
                >
                    <span style={{ fontSize: '16px' }}>📋</span>
                    JSON
                </button>
            )}

            {showPrint && (
                <button
                    onClick={exportToPrint}
                    style={{ ...buttonStyles.base, ...buttonStyles.print }}
                    title="چاپ گزارش"
                    disabled={!hasData}
                >
                    <span style={{ fontSize: '16px' }}>🖨️</span>
                    چاپ
                </button>
            )}

            {showText && (
                <button
                    onClick={exportToText}
                    style={{ ...buttonStyles.base, ...buttonStyles.text }}
                    title="دانلود فایل متنی"
                    disabled={!hasData}
                >
                    <span style={{ fontSize: '16px' }}>📝</span>
                    متنی
                </button>
            )}

            {!hasData && (
                <div style={{
                    color: '#666',
                    fontSize: '13px',
                    padding: '8px',
                    fontStyle: 'italic'
                }}>
                    (برای خروجی ابتدا داده‌ها را بارگذاری کنید)
                </div>
            )}

            <style>
                {`
                    .export-buttons-container button:hover:not(:disabled) {
                        opacity: 0.9;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    }
                    
                    .export-buttons-container button:active:not(:disabled) {
                        transform: translateY(0);
                    }
                    
                    .export-buttons-container button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                        transform: none;
                        box-shadow: none;
                    }
                    
                    @media (max-width: 768px) {
                        .export-buttons-container {
                            justify-content: center;
                        }
                        
                        .export-buttons-container button {
                            min-width: 100px;
                            padding: 8px 12px;
                            font-size: 13px;
                        }
                    }
                `}
            </style>
        </div>
    );
};

ExportButtons.defaultProps = {
    data: [],
    filename: 'export',
    columns: [],
    title: '',
    includeDate: true,
    showCSV: true,
    showJSON: true,
    showPrint: true,
    showText: true
};

export default ExportButtons;