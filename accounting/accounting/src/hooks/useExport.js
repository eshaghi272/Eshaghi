// src/hooks/useExport.js
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const useExport = () => {

    const exportToExcel = useCallback((data, options = {}) => {
        const {
            filename = 'export',
            sheetName = 'Sheet1',
            columns = [],
            includeDate = true
        } = options;

        if (!data || data.length === 0) {
            console.warn('هشدار: داده‌ای برای ذخیره وجود ندارد');
            return false;
        }

        try {
            const wb = XLSX.utils.book_new();
            let worksheetData;

            if (columns.length > 0) {
                worksheetData = data.map(item => {
                    const row = {};
                    columns.forEach(col => {
                        row[col.header] = item[col.accessor];
                    });
                    return row;
                });
            } else {
                worksheetData = [...data];
            }

            const ws = XLSX.utils.json_to_sheet(worksheetData);

            if (columns.length > 0) {
                const wscols = columns.map(col => ({
                    wch: col.width || Math.max(
                        col.header.length,
                        ...worksheetData.map(row => String(row[col.header] || '').length)
                    ) + 2
                }));
                ws['!cols'] = wscols;
            }

            XLSX.utils.book_append_sheet(wb, ws, sheetName);

            const dateStr = includeDate ? `_${new Date().toISOString().split('T')[0]}` : '';
            const finalFilename = `${filename}${dateStr}.xlsx`;

            XLSX.writeFile(wb, finalFilename);
            return true;
        } catch (error) {
            console.error('خطا در ایجاد فایل اکسل:', error);
            return false;
        }
    }, []);

    const exportToPDF = useCallback((data, options = {}) => {
        const {
            filename = 'export',
            title = '',
            columns = [],
            includeDate = true,
            orientation = 'portrait'
        } = options;

        if (!data || data.length === 0) {
            console.warn('هشدار: داده‌ای برای ذخیره وجود ندارد');
            return false;
        }

        try {
            const doc = new jsPDF({
                orientation,
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const dateStr = new Date().toLocaleDateString('fa-IR');

            // عنوان
            if (title) {
                doc.setFontSize(16);
                doc.text(title, pageWidth / 2, 15, { align: 'center' });
            }

            // تاریخ
            if (includeDate) {
                doc.setFontSize(10);
                doc.text(`تاریخ: ${dateStr}`, pageWidth - 10, 10, { align: 'right' });
            }

            let headers, tableData;

            if (columns.length > 0) {
                headers = columns.map(col => col.header);
                tableData = data.map(item =>
                    columns.map(col => {
                        let value = item[col.accessor];
                        if (col.format) value = col.format(value);
                        if (value === null || value === undefined) return '';
                        return String(value);
                    })
                );
            } else if (data[0]) {
                headers = Object.keys(data[0]);
                tableData = data.map(item => Object.values(item));
            } else {
                headers = [];
                tableData = [];
            }

            doc.autoTable({
                startY: title ? 25 : 20,
                head: [headers],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [66, 133, 244],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                styles: {
                    halign: 'right',
                    font: 'helvetica'
                }
            });

            const dateStrForFilename = includeDate ? `_${new Date().toISOString().split('T')[0]}` : '';
            const finalFilename = `${filename}${dateStrForFilename}.pdf`;
            doc.save(finalFilename);

            return true;
        } catch (error) {
            console.error('خطا در ایجاد فایل PDF:', error);
            return false;
        }
    }, []);

    const exportTable = useCallback((tableId, format, options = {}) => {
        const { filename = 'table_export', includeDate = true } = options;

        const table = document.getElementById(tableId);
        if (!table) {
            console.error(`جدول با شناسه ${tableId} یافت نشد`);
            return false;
        }

        try {
            const dateStr = includeDate ? `_${new Date().toISOString().split('T')[0]}` : '';

            if (format === 'excel') {
                const wb = XLSX.utils.table_to_book(table, { sheet: 'Sheet1' });
                XLSX.writeFile(wb, `${filename}${dateStr}.xlsx`);
            } else if (format === 'pdf') {
                const doc = new jsPDF('p', 'mm', 'a4');
                doc.autoTable({ html: table });
                doc.save(`${filename}${dateStr}.pdf`);
            }

            return true;
        } catch (error) {
            console.error(`خطا در export ${format.toUpperCase()}:`, error);
            return false;
        }
    }, []);

    return {
        exportToExcel,
        exportToPDF,
        exportTable
    };
};

export default useExport;