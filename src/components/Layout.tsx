import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, IndianRupee, Settings as SettingsIcon, LogOut, Menu, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Layout({ onLogout }: { onLogout: () => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [schoolSettings, setSchoolSettings] = useState({ schoolName: 'Loading...', logoUrl: '' });
  const location = useLocation();

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) setSchoolSettings(data);
      })
      .catch(err => console.error(err));
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/fees', label: 'Fee Collection', icon: IndianRupee },
    { path: '/fee-structure', label: 'Fee Structure', icon: FileText },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-slate-900 text-white flex flex-col shadow-xl z-20 overflow-hidden"
          >
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
              {schoolSettings.logoUrl ? (
                <img 
                  src={schoolSettings.logoUrl} 
                  alt="Logo" 
                  className="w-10 h-10 rounded-lg object-cover bg-white" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    // Fallback to initial if image fails
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = "w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-xl";
                      fallback.innerText = schoolSettings.schoolName.charAt(0);
                      parent.insertBefore(fallback, e.target as HTMLImageElement);
                    }
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-xl">
                  {schoolSettings.schoolName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-sm truncate">{schoolSettings.schoolName}</h1>
                <p className="text-xs text-slate-400">Admin Panel</p>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <button
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0 z-10">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-slate-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-slate-50">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
