import React, { useState } from 'react';
import DataService from '../services/DataService';

const DebugPanel: React.FC = () => {
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-xs z-50 hover:bg-gray-700 transition"
      >
        🐛 Debug
      </button>
    );
  }

  const data = DataService.getAppointments();
  const users = DataService.getUsers();

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-4 max-w-md max-h-96 overflow-auto z-50 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm text-gray-800 dark:text-white">🐛 Debug Panel</h3>
        <button 
          onClick={() => setShow(false)} 
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      <div className="text-xs space-y-2">
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">Users ({users.length}):</p>
          <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(users, null, 2)}
          </pre>
        </div>
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">Appointments ({data.length}):</p>
          <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">LocalStorage:</p>
          <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto max-h-32">
            {localStorage.getItem('dr-tahmineh-data') || 'Empty'}
          </pre>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              localStorage.removeItem('dr-tahmineh-data');
              localStorage.removeItem('currentUser');
              window.location.reload();
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
          >
            🔄 Reset All Data
          </button>
          <button
            onClick={() => {
              console.log('📊 Full Data:', DataService.getAppointments());
              console.log('👤 Users:', DataService.getUsers());
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
          >
            📊 Console Log
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ اضافه کردن export default
export default DebugPanel;