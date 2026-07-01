import jsPDF from "jspdf";
// import * as html2canvas from "html2canvas";
import html2canvas from "html2canvas/dist/html2canvas.min";

// import html2canvas from "html2canvas";

export default function ReportExporter({ targetId, title = "گزارش", showPrint = true, showPDF = true }) {
  const handlePrint = () => {
    const printContent = document.getElementById(targetId);
    if (!printContent) return alert("📄 بخش گزارش یافت نشد");

    const win = window.open("", "", "width=900,height=700");
    win.document.write(`<html><head><title>${title}</title></head><body>${printContent.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handlePDF = async () => {
    const element = document.getElementById(targetId);
    if (!element) return alert("📄 بخش گزارش یافت نشد");

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(`${title}.pdf`);
  };

  return (
    <div className="flex gap-4 mt-4">
      {showPrint && (
        <button onClick={handlePrint} className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">
          🖨️ چاپ
        </button>
      )}
      {showPDF && (
        <button onClick={handlePDF} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          📄 ذخیره PDF
        </button>
      )}
    </div>
  );
}
