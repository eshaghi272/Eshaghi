// services/healthCheck.js
class HealthCheckService {
  constructor() {
    this.isServerAvailable = true;
    this.checkInterval = null;
  }

  async checkServerHealth(serverUrl) {
    try {
      const response = await fetch(`${serverUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        this.isServerAvailable = true;
        return true;
      }
      
      this.isServerAvailable = false;
      return false;
      
    } catch (error) {
      console.error('Health check failed:', error);
      this.isServerAvailable = false;
      return false;
    }
  }

  startMonitoring(serverUrl, callback, interval = 5000) {
    this.checkInterval = setInterval(async () => {
      const status = await this.checkServerHealth(serverUrl);
      callback(status);
    }, interval);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export default new HealthCheckService();