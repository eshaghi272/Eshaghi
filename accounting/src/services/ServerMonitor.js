// services/ServerMonitor.js
class ServerMonitor {
  constructor() {
    this.listeners = [];
    this.isServerAvailable = true;
    this.checkInterval = null;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners(status) {
    this.listeners.forEach(listener => listener(status));
  }

  startMonitoring(url, interval = 3000) {
    this.checkInterval = setInterval(async () => {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(2000)
        });
        
        const newStatus = response.ok || response.status === 404 || response.status === 401;
        
        if (this.isServerAvailable !== newStatus) {
          this.isServerAvailable = newStatus;
          this.notifyListeners(newStatus);
          
          if (newStatus) {
            console.log('✅ سرور آنلاین شد - صفحه را رفرش می‌کنیم');
            // اگر سرور آنلاین شد و صفحه خطا نمایش داده می‌شود، رفرش کن
            if (window.location.pathname === '/') {
              window.location.reload();
            }
          }
        }
      } catch (error) {
        if (this.isServerAvailable !== false) {
          this.isServerAvailable = false;
          this.notifyListeners(false);
        }
      }
    }, interval);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export default new ServerMonitor();