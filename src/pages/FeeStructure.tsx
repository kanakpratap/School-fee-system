import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Building2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function FeeStructure() {
  const [fees, setFees] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [feeToDelete, setFeeToDelete] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    studentClass: 'School', // 'School' or specific class like '10', '9'
    feeType: '',
    amount: ''
  });

  const fetchFees = () => {
    fetch('/api/fees/structure')
      .then(res => res.json())
      .then(data => setFees(data));
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingFee ? `/api/fees/structure/${editingFee.id}` : '/api/fees/structure';
    const method = editingFee ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentClass: formData.studentClass,
          feeType: formData.feeType,
          amount: Number(formData.amount)
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setErrorMessage(`Error: ${errorData.error || 'Failed to save fee structure'}`);
        return;
      }

      setIsModalOpen(false);
      setEditingFee(null);
      setFormData({ studentClass: 'School', feeType: '', amount: '' });
      fetchFees();
    } catch (error) {
      console.error('Failed to save fee:', error);
      setErrorMessage('Network error. Failed to save fee structure.');
    }
  };

  const confirmDelete = async () => {
    if (feeToDelete) {
      try {
        await fetch(`/api/fees/structure/${feeToDelete}`, { method: 'DELETE' });
        fetchFees();
      } catch (error) {
        console.error('Failed to delete fee:', error);
        setErrorMessage('Failed to delete fee structure.');
      } finally {
        setFeeToDelete(null);
      }
    }
  };

  const openEditModal = (fee: any) => {
    setEditingFee(fee);
    setFormData({
      studentClass: fee.class,
      feeType: fee.feeType,
      amount: fee.amount.toString()
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fee Structure</h1>
        <button
          onClick={() => {
            setEditingFee(null);
            setFormData({ studentClass: 'School', feeType: '', amount: '' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-500/20"
        >
          <Plus size={16} />
          Add Fee
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">Applicability</th>
                <th className="p-4">Fee Type</th>
                <th className="p-4">Amount (₹)</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fees.map((fee) => (
                <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    {fee.class === 'School' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
                        <Building2 size={14} />
                        School Fee (All)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                        <Users size={14} />
                        Class {fee.class}
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-medium text-slate-800">{fee.feeType}</td>
                  <td className="p-4 text-slate-600 font-mono">₹{fee.amount.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(fee)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setFeeToDelete(fee.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {fees.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 text-sm">
                    No fee structures defined.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">
                  {editingFee ? 'Edit Fee' : 'Add New Fee'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Applicability</label>
                  <select
                    required
                    value={formData.studentClass === 'School' ? 'School' : 'Class'}
                    onChange={(e) => {
                      if (e.target.value === 'School') {
                        setFormData({ ...formData, studentClass: 'School' });
                      } else {
                        setFormData({ ...formData, studentClass: '' });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-sm"
                  >
                    <option value="School">School Fee (Applies to all classes)</option>
                    <option value="Class">Class Specific Fee</option>
                  </select>
                </div>

                {formData.studentClass !== 'School' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Class Level</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., 10, 9, 8"
                      value={formData.studentClass}
                      onChange={(e) => setFormData({ ...formData, studentClass: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Fee Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Tuition, Library, Exam"
                    value={formData.feeType}
                    onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-sm font-mono"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
                  >
                    {editingFee ? 'Update Fee' : 'Save Fee'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {feeToDelete !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6"
            >
              <h2 className="text-lg font-bold text-slate-800 mb-2">Confirm Delete</h2>
              <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete this fee structure? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setFeeToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Message Modal */}
      <AnimatePresence>
        {errorMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6"
            >
              <h2 className="text-lg font-bold text-rose-600 mb-2">Error</h2>
              <p className="text-sm text-slate-600 mb-6">{errorMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setErrorMessage(null)}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
