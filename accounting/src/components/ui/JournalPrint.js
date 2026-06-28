import React from "react";

const JournalPrint = ({
    documentNumber,
    entryDate,
    selectedJalaliDate,
    description,
    lines,
    totalDebit,
    totalCredit,
    isBalanced,
    id
}) => {

    // تابع اصلی چاپ
    const handlePrint = () => {
        // ایجاد یک پنجره جدید برای چاپ
        const printWindow = window.open('', '_blank');

        // محتوای HTML برای چاپ
        const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>چاپ سند حسابداری - شماره ${documentNumber}</title>
        <style>
          body {
            font-family: Tahoma, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #000;
            margin: 20px;
            padding: 0;
            background-color: #fff;
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
          .header .subtitle {
            font-size: 14px;
            color: #7f8c8d;
            margin-top: 5px;
          }
          .info-section {
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
          }
          .info-item {
            margin-bottom: 10px;
            margin-left: 20px;
          }
          .info-label {
            font-weight: bold;
            color: #2c3e50;
          }
          .info-value {
            margin-right: 10px;
            color: #34495e;
          }
          .description-box {
            margin: 15px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          .description-label {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
            display: block;
          }
          .table-container {
            margin: 20px 0;
            overflow-x: auto;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .table th {
            background-color: #f2f2f2;
            border: 1px solid #ddd;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            color: #2c3e50;
          }
          .table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          .table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .table tr:hover {
            background-color: #f5f5f5;
          }
          .totals {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #000;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
          }
          .total-label {
            font-weight: bold;
            color: #2c3e50;
          }
          .total-value {
            font-family: monospace;
            font-weight: bold;
            color: #2c3e50;
          }
          .balance-status {
            text-align: center;
            margin: 25px 0;
            font-weight: bold;
            font-size: 14px;
            padding: 10px;
            border-radius: 5px;
          }
          .balance-ok {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          .balance-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .print-date {
            margin-top: 5px;
            font-style: italic;
          }
          .amount-cell {
            font-family: 'Courier New', monospace;
            text-align: left;
            direction: ltr;
            font-weight: bold;
          }
          .row-number {
            text-align: center;
            font-weight: bold;
            color: #2c3e50;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
            .table th {
              background-color: #f2f2f2 !important;
              -webkit-print-color-adjust: exact;
            }
            .table tr:nth-child(even) {
              background-color: #f9f9f9 !important;
              -webkit-print-color-adjust: exact;
            }
            .balance-ok {
              background-color: #d4edda !important;
              -webkit-print-color-adjust: exact;
            }
            .balance-error {
              background-color: #f8d7da !important;
              -webkit-print-color-adjust: exact;
            }
          }
          @page {
            margin: 0.5cm;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>سند حسابداری</h1>
          <div class="subtitle">سیستم حسابداری</div>
        </div>
        
        <div class="info-section">
          <div>
            <div class="info-item">
              <span class="info-label">شماره سند:</span>
              <span class="info-value">${documentNumber}</span>
            </div>
            <div class="info-item">
              <span class="info-label">شناسه سند:</span>
              <span class="info-value">${id}</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">تاریخ شمسی:</span>
              <span class="info-value">${selectedJalaliDate || '---'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">تاریخ میلادی:</span>
              <span class="info-value">${entryDate ? entryDate.toISOString().split('T')[0] : '---'}</span>
            </div>
          </div>
        </div>
        
        <div class="description-box">
          <span class="description-label">شرح سند:</span>
          <span>${description || 'بدون شرح'}</span>
        </div>
        
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th width="50">ردیف</th>
                <th width="100">کد حساب</th>
                <th>عنوان حساب</th>
                <th width="120">بدهکار</th>
                <th width="120">بستانکار</th>
              </tr>
            </thead>
            <tbody>
              ${lines.map((line, idx) => `
                <tr>
                  <td class="row-number">${idx + 1}</td>
                  <td>${line.AccountCode || '---'}</td>
                  <td>${line.TitleFa || '---'}</td>
                  <td class="amount-cell">${Number(line.DebitAmount || 0).toLocaleString('en-US')}</td>
                  <td class="amount-cell">${Number(line.CreditAmount || 0).toLocaleString('en-US')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="totals">
          <div class="total-row">
            <span class="total-label">جمع بدهکار:</span>
            <span class="total-value">${totalDebit.toLocaleString('en-US')}</span>
          </div>
          <div class="total-row">
            <span class="total-label">جمع بستانکار:</span>
            <span class="total-value">${totalCredit.toLocaleString('en-US')}</span>
          </div>
          <div class="total-row">
            <span class="total-label">تفاوت:</span>
            <span class="total-value">${Math.abs(totalDebit - totalCredit).toLocaleString('en-US')}</span>
          </div>
        </div>
        
        <div class="balance-status ${isBalanced ? 'balance-ok' : 'balance-error'}">
          ${isBalanced ? '✅ سند کاملاً تراز است' : '❌ سند غیرتراز است'}
        </div>
        
        <div class="footer">
          <div>چاپ شده از سیستم حسابداری</div>
          <div class="print-date">تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')} - ساعت: ${new Date().toLocaleTimeString('fa-IR')}</div>
          <div>تعداد ردیف‌ها: ${lines.length} ردیف | وضعیت: ${isBalanced ? 'تراز' : 'غیرتراز'}</div>
        </div>
        
        <script>
          // چاپ خودکار پس از لود صفحه
          window.onload = function() {
            // تأخیر کوتاه برای اطمینان از لود کامل
            setTimeout(function() {
              window.print();
              // بستن پنجره پس از چاپ (در صورت تأیید کاربر)
              window.onafterprint = function() {
                setTimeout(function() {
                  window.close();
                }, 100);
              };
            }, 300);
          };
          
          // همچنین دکمه کلیک برای چاپ
          document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
              e.preventDefault();
              window.print();
            }
          });
        </script>
      </body>
      </html>
    `;

        // نوشتن محتوا در پنجره
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    // محاسبه تعداد ردیف‌های معتبر
    const validLinesCount = lines.filter(l => l.AccountCode && (Number(l.DebitAmount) !== 0 || Number(l.CreditAmount) !== 0)).length;

    return (
        <div className="journal-print-component">
            {/* دکمه چاپ */}
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                title="چاپ سند حسابداری"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                </svg>
                چاپ سند
            </button>

            {/* اطلاعات خلاصه (اختیاری - می‌تواند در tooltip یا hover نمایش داده شود) */}
            <div className="hidden print-info">
                <div>شماره سند: {documentNumber}</div>
                <div>تاریخ: {selectedJalaliDate}</div>
                <div>تعداد ردیف‌ها: {validLinesCount}</div>
                <div>وضعیت: {isBalanced ? 'تراز' : 'غیرتراز'}</div>
            </div>
        </div>
    );
};

// PropTypes برای مستندسازی بهتر
JournalPrint.defaultProps = {
    documentNumber: "",
    entryDate: null,
    selectedJalaliDate: "",
    description: "",
    lines: [],
    totalDebit: 0,
    totalCredit: 0,
    isBalanced: false,
    id: ""
};

export default JournalPrint;