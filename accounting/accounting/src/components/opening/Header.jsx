import React from 'react';
import { ArrowRight } from 'lucide-react';

const Header = ({ title, subtitle, stepInfo, onBack }) => {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            بازگشت
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>
      </div>
      {stepInfo && (
        <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-medium">
          {stepInfo}
        </div>
      )}
    </div>
  );
};

export default Header;