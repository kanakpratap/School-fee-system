import React, { useEffect, useState } from 'react';
import { IndianRupee, Users, AlertCircle, TrendingUp, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import * as XLSX from 'xlsx';

export function Dashboard() {
  const [analytics, setAnalytics] = useState<any>({
    totalStudents: 0,
    totalCollection: 0,
    dailyCollection: []
  });
  const [defaulters, setDefaulters] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => setAnalytics(data));

    fetch('/api/defaulters')
      .then(res => res.json())
      .then(data => setDefaulters(data));
  }, []);

  const exportToExcel = async () => {
    try {
      const res = await fetch('/api/payments');
      const payments = await res.json();
      
      const worksheet = XLSX.utils.json_to_sheet(payments.map((p: any) => ({
        'Receipt No': `REC-${p.id}`,
        'Date': new Date(p.paymentDate).toLocaleDateString(),
        'Student Name': p.studentName,
        'Roll No': p.rollNo,
        'Class': `${p.class}-${p.section}`,
        'Month': p.month,
        'Base Amount': p.amount,
        'Late Fine': p.lateFine,
        'Discount': p.discount,
        'Total Paid': p.totalAmount,
        'Payment Mode': p.paymentMode
      })));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Collections');
      XLSX.writeFile(workbook, `Fee_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Failed to export', error);
      alert('Failed to generate report.');
    }
  };

  const stats = [
    {
      title: 'Total Collection',
      value: `₹${analytics.totalCollection.toLocaleString()}`,
      icon: IndianRupee,
      color: 'bg-emerald-500',
      trend: '+12% from last month'
    },
    {
      title: 'Total Students',
      value: analytics.totalStudents.toString(),
      icon: Users,
      color: 'bg-indigo-500',
      trend: 'Active enrollments'
    },
    {
      title: 'Pending Dues',
      value: defaulters.length.toString(),
      icon: AlertCircle,
      color: 'bg-rose-500',
      trend: 'Students with unpaid fees'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
        <button onClick={exportToExcel} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between group hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</h3>
                <p className="text-xs text-slate-400 mt-2 font-medium">{stat.trend}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner ${stat.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">Collection Trends (Last 7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyCollection}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defaulters List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Defaulters List</h3>
            <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {defaulters.length} Pending
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {defaulters.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-10">
                No defaulters found for this month.
              </div>
            ) : (
              defaulters.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{student.name}</p>
                      <p className="text-xs text-slate-500 font-medium">Class {student.class} - {student.section}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-600">Unpaid</p>
                    <p className="text-[10px] text-slate-400 font-mono">{student.rollNo}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
