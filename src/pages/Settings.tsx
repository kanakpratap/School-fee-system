import React, { useState, useEffect, useRef } from 'react';
import { Save, Building2, MapPin, Image as ImageIcon, Upload } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState({
    schoolName: '',
    address: '',
    logoUrl: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) setSettings(data);
      });
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert('Settings saved successfully!');
      // Reload to update layout logo
      window.location.reload();
    } catch (error) {
      console.error('Failed to save settings', error);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Settings</h1>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight border-b border-slate-100 pb-4">School Branding</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} className="text-indigo-500" />
                School Name
              </label>
              <input
                type="text"
                required
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-sm transition-shadow"
                placeholder="Enter official school name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={16} className="text-indigo-500" />
                School Address
              </label>
              <textarea
                required
                rows={3}
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-sm transition-shadow resize-none"
                placeholder="Enter complete school address"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={16} className="text-indigo-500" />
                Logo URL or Upload
              </label>
              <div className="flex gap-4 items-start">
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-sm transition-shadow"
                    placeholder="https://example.com/logo.png or upload file"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-slate-200"
                  >
                    <Upload size={16} />
                    Upload
                  </button>
                </div>
                {settings.logoUrl && (
                  <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
                    <img 
                      src={settings.logoUrl} 
                      alt="Logo Preview" 
                      className="max-w-full max-h-full object-contain" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = 'block';
                      }}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Provide a direct link or upload an image (max 2MB).</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-500/20 disabled:opacity-50"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
