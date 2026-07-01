// hooks/useFetchWithError.js - نسخه ساده‌شده
import { useState, useEffect, useCallback, useRef } from 'react';

export const useFetchWithError = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isServerAvailable, setIsServerAvailable] = useState(true);
  
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const checkServerHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });

      clearTimeout(timeoutId);

      if (isMountedRef.current) {
        // اگر سرور پاسخ داد
        if (response.ok || response.status === 404 || response.status === 401) {
          if (!isServerAvailable) {
            console.log('✅ سرور آنلاین شد - رفرش صفحه');
            window.location.reload();
          }
          setIsServerAvailable(true);
          setError(null);
          
          if (response.ok) {
            const result = await response.json();
            setData(result);
          }
        } else {
          setIsServerAvailable(false);
        }
      }
      
    } catch (err) {
      if (isMountedRef.current) {
        if (err.name === 'TypeError' || err.name === 'AbortError') {
          setIsServerAvailable(false);
        }
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [url, options, isServerAvailable]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // بررسی اولیه
    checkServerHealth();

    // فقط زمانی که سرور آفلاین است، interval را فعال کن
    if (!isServerAvailable) {
      intervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          checkServerHealth();
        }
      }, 3000); // هر 3 ثانیه وقتی سرور آفلاین است
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkServerHealth, isServerAvailable]); // وابستگی به isServerAvailable

  return { 
    data, 
    loading, 
    error, 
    isServerAvailable,
    retry: checkServerHealth 
  };
};