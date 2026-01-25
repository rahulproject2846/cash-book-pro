"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // আপডেট করা হয়েছে
import * as XLSX from "xlsx";
import { FileDown, FileSpreadsheet } from "lucide-react";

export const ExportTools = ({ entries, bookName }: { entries: any[], bookName: string }) => {
  
  const exportToExcel = () => {
    const data = entries.map((e) => ({
      Date: new Date(e.date).toLocaleDateString(),
      Title: e.title,
      Category: e.category,
      Method: e.paymentMethod,
      Type: e.type.toUpperCase(),
      Amount: e.amount,
      Status: e.status,
      Note: e.note || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, `${bookName}_Report.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("CASHBOOK PRO REPORT", 14, 20);
    doc.setFontSize(11);
    doc.text(`Book Name: ${bookName}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

    const tableColumn = ["Date", "Title", "Category", "Method", "Type", "Amount", "Status"];
    const tableRows = entries.map((e) => [
      new Date(e.date).toLocaleDateString(),
      e.title,
      e.category,
      e.paymentMethod,
      e.type.toUpperCase(),
      e.amount.toLocaleString(),
      e.status
    ]);

    // doc.autoTable এর বদলে সরাসরি autoTable কল করা হয়েছে
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 }
    });

    doc.save(`${bookName}_Report.pdf`);
  };

  return (
    <div className="flex gap-2 mb-6">
      <button onClick={exportToPDF} className="flex-1 glass-card p-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-400 transition-all border-white/5">
        <FileDown size={16} /> Export PDF
      </button>
      <button onClick={exportToExcel} className="flex-1 glass-card p-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-green-400 transition-all border-white/5">
        <FileSpreadsheet size={16} /> Export Excel
      </button>
    </div>
  );
};