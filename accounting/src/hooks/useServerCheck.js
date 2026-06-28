// hooks/useServerCheck.js
import { useState, useEffect } from 'react';

export const useServerCheck = (url) => {
  const [isServerAvailable, setIsServerAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(3000) // 3 ثانیه timeout
        });
        
        // اگر سرور پاسخ داد (حتی با خطای 404)
        if (response.ok || response.status === 404 || response.status === 401) {
          setIsServerAvailable(true);
        } else {
          setIsServerAvailable(false);
        }
      } catch (err) {
        // هر نوع خطایی یعنی سرور در دسترس نیست
        setIsServerAvailable(false);
      } finally {
        setLoading(false);
      }
    };

    checkServer();
  }, [url]);

  return { isServerAvailable, loading };
};