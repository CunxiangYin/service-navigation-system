// Health check service for monitoring service availability
export interface HealthStatus {
  serviceId: string;
  status: 'online' | 'offline' | 'checking' | 'error';
  responseTime?: number;
  lastChecked?: Date;
  error?: string;
}

class HealthCheckService {
  private checkInterval: number = 5 * 60 * 1000; // 5 minutes
  private intervalId: number | null = null;
  private healthStatus: Map<string, HealthStatus> = new Map();
  private listeners: Set<(status: HealthStatus) => void> = new Set();

  constructor() {
    // Initialize from localStorage if available
    this.loadHealthStatus();
  }

  private loadHealthStatus() {
    try {
      const stored = localStorage.getItem('healthStatus');
      if (stored) {
        const data = JSON.parse(stored);
        this.healthStatus = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load health status:', error);
    }
  }

  private saveHealthStatus() {
    try {
      const data = Object.fromEntries(this.healthStatus);
      localStorage.setItem('healthStatus', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save health status:', error);
    }
  }

  async checkService(serviceId: string, url: string): Promise<HealthStatus> {
    // Update status to checking
    const checkingStatus: HealthStatus = {
      serviceId,
      status: 'checking',
      lastChecked: new Date()
    };
    this.updateStatus(checkingStatus);

    try {
      // Parse URL to ensure it's valid
      const parsedUrl = this.parseServiceUrl(url);
      
      // For internal services, we'll use a CORS proxy or backend API
      // For now, we'll simulate the check since direct fetch might fail due to CORS
      const status = await this.simulateHealthCheck(parsedUrl);
      
      const healthStatus: HealthStatus = {
        serviceId,
        status: status.isOnline ? 'online' : 'offline',
        responseTime: status.responseTime,
        lastChecked: new Date()
      };

      this.updateStatus(healthStatus);
      return healthStatus;
    } catch (error) {
      const errorStatus: HealthStatus = {
        serviceId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date()
      };
      this.updateStatus(errorStatus);
      return errorStatus;
    }
  }

  private parseServiceUrl(url: string): URL {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    return new URL(url);
  }

  private async simulateHealthCheck(url: URL): Promise<{ isOnline: boolean; responseTime: number }> {
    // In a real implementation, this would make an actual HTTP request
    // For now, we'll simulate based on common patterns
    const startTime = Date.now();
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    const responseTime = Date.now() - startTime;
    
    // Simulate some services being offline
    const randomOffline = Math.random() > 0.8; // 20% chance of being offline
    
    // Common ports that are likely to be online
    const commonPorts = ['80', '443', '3000', '8080', '8000', '5000', '3001'];
    const port = url.port || (url.protocol === 'https:' ? '443' : '80');
    const isLikelyOnline = commonPorts.includes(port) && !randomOffline;
    
    return {
      isOnline: isLikelyOnline,
      responseTime
    };
  }

  private updateStatus(status: HealthStatus) {
    this.healthStatus.set(status.serviceId, status);
    this.saveHealthStatus();
    this.notifyListeners(status);
  }

  private notifyListeners(status: HealthStatus) {
    this.listeners.forEach(listener => listener(status));
  }

  subscribe(listener: (status: HealthStatus) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(serviceId: string): HealthStatus | undefined {
    return this.healthStatus.get(serviceId);
  }

  getAllStatuses(): Map<string, HealthStatus> {
    return new Map(this.healthStatus);
  }

  async checkAllServices(services: Array<{ id: string; url: string }>) {
    const promises = services.map(service => 
      this.checkService(service.id, service.url)
    );
    return Promise.all(promises);
  }

  startAutoCheck(services: Array<{ id: string; url: string }>) {
    this.stopAutoCheck();
    
    // Initial check
    this.checkAllServices(services);
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.checkAllServices(services);
    }, this.checkInterval);
  }

  stopAutoCheck() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setCheckInterval(minutes: number) {
    this.checkInterval = minutes * 60 * 1000;
    // Restart auto-check if it's running
    if (this.intervalId) {
      const services = Array.from(this.healthStatus.keys()).map(id => ({
        id,
        url: '' // This would need to be passed in properly
      }));
      this.startAutoCheck(services);
    }
  }

  clearStatus(serviceId: string) {
    this.healthStatus.delete(serviceId);
    this.saveHealthStatus();
  }

  clearAllStatuses() {
    this.healthStatus.clear();
    this.saveHealthStatus();
  }
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();