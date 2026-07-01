import React from 'react';
import { Calendar, FileText, Calculator, Lock, CheckCircle } from 'lucide-react';

const StepIndicator = ({ steps, currentStep }) => {
  const getIcon = (iconName) => {
    switch(iconName) {
      case 'calendar': return <Calendar className="w-6 h-6" />;
      case 'file-text': return <FileText className="w-6 h-6" />;
      case 'calculator': return <Calculator className="w-6 h-6" />;
      case 'lock': return <Lock className="w-6 h-6" />;
      case 'check-circle': return <CheckCircle className="w-6 h-6" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.step}>
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                step.status === 'completed' ? 'bg-green-100 text-green-600' :
                step.status === 'active' ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-400'
              }`}>
                {getIcon(step.icon)}
              </div>
              <div className="text-center">
                <div className={`text-sm font-medium ${
                  step.status === 'completed' ? 'text-green-700' :
                  step.status === 'active' ? 'text-blue-700' :
                  'text-gray-500'
                }`}>
                  مرحله {step.step}
                </div>
                <div className="text-xs text-gray-600">{step.title}</div>
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-4">
                <div className={`h-full ${
                  steps[index + 1].status === 'pending' 
                    ? 'bg-gray-200' 
                    : 'bg-green-200'
                }`}></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* نمایش موبایل */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              steps[currentStep - 1].status === 'completed' ? 'bg-green-100 text-green-600' :
              steps[currentStep - 1].status === 'active' ? 'bg-blue-100 text-blue-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {getIcon(steps[currentStep - 1].icon)}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">
                مرحله {currentStep} از {steps.length}
              </div>
              <div className="text-xs text-gray-600">{steps[currentStep - 1].title}</div>
            </div>
          </div>
        </div>
        
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;