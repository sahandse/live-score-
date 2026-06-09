import { useState } from 'react';
import { Key, ExternalLink, X, CheckCircle } from 'lucide-react';
import { setApiKey, hasApiKey, removeApiKey } from '../services/footballApi';
import { useApp } from '../context/AppContext';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function ApiKeyModal({ onClose, onSaved }: Props) {
  const { darkMode } = useApp();
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!key.trim()) return;
    setApiKey(key);
    setSaved(true);
    setTimeout(() => { onSaved(); onClose(); }, 800);
  };

  const handleRemove = () => {
    removeApiKey();
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl ${
        darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
              <Key size={18} className="text-white" />
            </div>
            <div>
              <h2 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>دیتای واقعی</h2>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>football-data.org API</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
            <X size={18} />
          </button>
        </div>

        <div className={`p-4 rounded-2xl mb-5 ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
          <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            برای دریافت دیتای زنده واقعی، یک API Key رایگان نیاز داری:
          </p>
          <ol className={`text-xs space-y-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>۱. در سایت زیر ثبت‌نام کن (رایگان)</li>
            <li>۲. کلید API از ایمیل ارسال می‌شه</li>
            <li>۳. کلید را اینجا وارد کن</li>
          </ol>
          <a
            href="https://www.football-data.org/client/register"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-3 text-xs text-emerald-500 hover:text-emerald-400"
          >
            <ExternalLink size={12} />
            football-data.org/client/register
          </a>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="API Key را اینجا وارد کن..."
            value={key}
            onChange={e => setKey(e.target.value)}
            className={`w-full px-4 py-3 rounded-2xl text-sm outline-none border transition-colors ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-600 focus:border-emerald-600'
                : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-emerald-500'
            }`}
          />
          <button
            onClick={handleSave}
            disabled={!key.trim() || saved}
            className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
              saved
                ? 'bg-emerald-500 text-white'
                : key.trim()
                  ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:opacity-90'
                  : darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saved ? (
              <span className="flex items-center justify-center gap-2"><CheckCircle size={16} /> ذخیره شد!</span>
            ) : 'ذخیره و اتصال'}
          </button>
          {hasApiKey() && (
            <button
              onClick={handleRemove}
              className={`w-full py-2.5 rounded-2xl text-sm font-medium ${
                darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
              } transition-colors`}
            >
              حذف کلید و استفاده از دیتای نمونه
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
