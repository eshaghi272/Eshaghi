import { useContext } from 'react';
import { DBContext } from '../context/DBContext';

export const useDB = () => {
  const context = useContext(DBContext);
  if (!context) {
    throw new Error('useDB must be used within a DBProvider');
  }
  return context;
};
