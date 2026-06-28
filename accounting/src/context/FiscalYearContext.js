// src/context/FiscalYearContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const FiscalYearContext = createContext();

export const useFiscalYear = () => useContext(FiscalYearContext);

export const FiscalYearProvider = ({ children }) => {
  const [years, setYears] = useState([]);
  const [activeYear, setActiveYear] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/fiscal-year")
      .then(res => res.json())
      .then(data => {
        const list = data.data || [];
        setYears(list);
        const current = list.find(y => y.IsActive === 1);
        if (current) setActiveYear(current.FiscalYearId);
      });
  }, []);

  return (
    <FiscalYearContext.Provider value={{ years, activeYear, setActiveYear }}>
      {children}
    </FiscalYearContext.Provider>
  );
};
