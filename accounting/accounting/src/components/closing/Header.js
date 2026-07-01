import React from 'react';
import { Lock, ChevronRight } from 'lucide-react';

const Header = ({ title, subtitle, stepInfo, onBack }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-6 mb-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {title}
            </h1>
            <p className="text-blue-100">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stepInfo && (
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {stepInfo}
            </div>
          )}
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
            بازگشت
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
