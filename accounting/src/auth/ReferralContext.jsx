import React, { createContext, useContext, useState } from 'react';

const ReferralContext = createContext(null);

export const useReferralContext = () => {
  const context = useContext(ReferralContext);
  if (!context) {
    throw new Error('useReferralContext باید داخل ReferralProvider استفاده شود');
  }
  return context;
};

export const ReferralProvider = ({ children }) => {
  const [referralCard, setReferralCard] = useState(null);

  return (
    <ReferralContext.Provider value={{ referralCard, setReferralCard }}>
      {children}
    </ReferralContext.Provider>
  );
};
