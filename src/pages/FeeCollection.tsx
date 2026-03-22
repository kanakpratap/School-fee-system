import React, { useState, useEffect } from 'react';
import { Search, Printer, IndianRupee, CreditCard, QrCode, Banknote } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function FeeCollection() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [feeStructure, setFeeStructure] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  const [formData, setFormData] = useState({
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    lateFine: 0,
    discount: 0,
    paymentMode: 'Cash'
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data));
  }, []);

  useEffect(() => {
    if (search.length > 2) {
      fetch(`/api/students?search=${search}`)
        .then(res => res.json())
        .then(data => setStudents(data));
    } else {
      setStudents([]);
    }
  }, [search]);

  useEffect(() => {
    if (selectedStudent) {
      fetch(`/api/fees/structure/${selectedStudent.class}`)
        .then(res => res.json())
        .then(data => setFeeStructure(data));
    }
  }, [selectedStudent]);

  const baseAmount = feeStructure.reduce((sum, fee) => sum + fee.amount, 0);
  const totalAmount = baseAmount + Number(formData.lateFine) - Number(formData.discount);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const paymentData = {
      studentId: selectedStudent.id,
      month: formData.month,
      amount: baseAmount,
      lateFine: Number(formData.lateFine),
      discount: Number(formData.discount),
      totalAmount,
      paymentMode: formData.paymentMode
    };

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      
      if (res.ok) {
        await generateReceipt(paymentData);
        alert('Payment successful and receipt generated!');
        setSelectedStudent(null);
        setSearch('');
        setFormData({ ...formData, lateFine: 0, discount: 0 });
      }
    } catch (error) {
      console.error('Payment failed', error);
      alert('Payment failed. Please try again.');
    }
  };

  const generateReceipt = async (paymentData: any) => {
    const doc = new jsPDF();
    
    // Header
    if (settings.logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        // Create a promise to wait for image load
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = settings.logoUrl;
        });
        
        const maxDim = 22;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          h = (h / w) * maxDim;
          w = maxDim;
        } else {
          w = (w / h) * maxDim;
          h = maxDim;
        }
        
        // Add image at top left
        doc.addImage(img, 'PNG', 20, 10, w, h);
      } catch (e) {
        console.warn('Failed to load logo for PDF', e);
      }
    }

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.schoolName || 'School Name', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.address || 'School Address', 105, 28, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Receipt Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FEE RECEIPT', 105, 45, { align: 'center' });
    
    // Student Details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt No: REC-${Date.now().toString().slice(-6)}`, 20, 60);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 60);
    
    doc.text(`Student Name: ${selectedStudent.name}`, 20, 70);
    doc.text(`Roll No: ${selectedStudent.rollNo}`, 140, 70);
    
    doc.text(`Class: ${selectedStudent.class} - ${selectedStudent.section}`, 20, 80);
    doc.text(`Fee Month: ${paymentData.month}`, 140, 80);

    // Fee Details Table
    const tableData = feeStructure.map(fee => [fee.feeType, `Rs. ${fee.amount.toFixed(2)}`]);
    
    if (paymentData.lateFine > 0) {
      tableData.push(['Late Fine', `Rs. ${paymentData.lateFine.toFixed(2)}`]);
    }
    if (paymentData.discount > 0) {
      tableData.push(['Discount', `- Rs. ${paymentData.discount.toFixed(2)}`]);
    }
    
    tableData.push(['TOTAL AMOUNT', `Rs. ${paymentData.totalAmount.toFixed(2)}`]);

    autoTable(doc, {
      startY: 95,
      head: [['Description', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
      willDrawCell: function(data: any) {
        if (data.row.index === tableData.length - 1) {
          doc.setFont('helvetica', 'bold');
        }
      }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(10);
    doc.text(`Payment Mode: ${paymentData.paymentMode}`, 20, finalY + 20);
    
    doc.text('Authorized Signatory', 150, finalY + 40);
    doc.line(140, finalY + 35, 190, finalY + 35);

    doc.save(`Receipt_${selectedStudent.rollNo}_${paymentData.month}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fee Collection</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search & Student Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Find Student</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search name or roll no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-sm"
              />
            </div>

            {students.length > 0 && !selectedStudent && (
              <div className="mt-2 border border-slate-100 rounded-xl overflow-hidden shadow-lg absolute z-10 bg-white w-full max-w-sm">
                {students.map(student => (
                  <div
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setSearch('');
                      setStudents([]);
                    }}
                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">{student.name}</p>
                      <p className="text-xs text-slate-500">Class {student.class}-{student.section}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{student.rollNo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedStudent && (
            <div className="bg-indigo-600 rounded-2xl p-6 shadow-md text-white">
              <h3 className="text-xs font-bold text-indigo-200 mb-4 uppercase tracking-wider">Selected Student</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-indigo-200 text-xs">Name</p>
                  <p className="font-bold text-lg">{selectedStudent.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-indigo-200 text-xs">Roll No</p>
                    <p className="font-mono">{selectedStudent.rollNo}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-xs">Class</p>
                    <p>{selectedStudent.class} - {selectedStudent.section}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="mt-6 w-full py-2 bg-indigo-700 hover:bg-indigo-800 rounded-xl text-sm font-medium transition-colors"
              >
                Change Student
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Payment Details */}
        <div className="lg:col-span-2">
          <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-opacity duration-300 ${!selectedStudent ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">Payment Details</h3>
            
            <form onSubmit={handlePayment} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Fee Month/Quarter</label>
                  <input
                    type="text"
                    required
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Cash', 'Check', 'UPI'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMode: mode })}
                        className={`py-2 text-xs font-medium rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors ${
                          formData.paymentMode === mode 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mode === 'Cash' && <Banknote size={16} />}
                        {mode === 'Check' && <CreditCard size={16} />}
                        {mode === 'UPI' && <QrCode size={16} />}
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-sm font-bold text-slate-800 mb-4">Fee Breakdown</h4>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  {feeStructure.map(fee => (
                    <div key={fee.id} className="flex justify-between text-sm">
                      <span className="text-slate-600">{fee.feeType}</span>
                      <span className="font-medium text-slate-800">₹{fee.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  
                  {feeStructure.length === 0 && (
                    <p className="text-sm text-slate-500 italic text-center py-2">Select a student to view fee structure.</p>
                  )}

                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Late Fine</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.lateFine}
                        onChange={(e) => setFormData({ ...formData, lateFine: Number(e.target.value) })}
                        className="w-24 px-2 py-1 text-right border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Discount</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                        className="w-24 px-2 py-1 text-right border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Total Payable</span>
                    <span className="text-xl font-bold text-indigo-600">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={!selectedStudent || totalAmount <= 0}
                  className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer size={18} />
                  Collect & Print Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
