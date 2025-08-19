import type { Service, Category } from '@/types';

// 数据同步服务
class DataSyncService {
  private broadcastChannel: BroadcastChannel | null = null;
  private syncCallbacks: Set<(data: any) => void> = new Set();
  private backendUrl: string | null = null;
  private syncDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    // 初始化 BroadcastChannel（用于同一域名下的标签页同步）
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('service-nav-sync');
      this.broadcastChannel.onmessage = (event) => {
        this.handleSyncMessage(event.data);
      };
    }

    // 监听 localStorage 变化（用于跨标签页同步）
    window.addEventListener('storage', this.handleStorageChange);

    // 检查是否配置了后端
    this.checkBackendConfig();
  }

  // 检查后端配置，默认使用本地后端
  private checkBackendConfig() {
    const config = localStorage.getItem('service-nav-backend-config');
    if (config) {
      try {
        const { url } = JSON.parse(config);
        this.backendUrl = url;
      } catch (error) {
        console.error('解析后端配置失败:', error);
        // 使用默认后端地址
        this.backendUrl = 'http://localhost:8001';
      }
    } else {
      // 如果没有配置，使用默认后端地址
      this.backendUrl = 'http://localhost:8001';
    }
  }

  // 设置后端URL
  setBackendUrl(url: string | null) {
    this.backendUrl = url;
    if (url) {
      localStorage.setItem('service-nav-backend-config', JSON.stringify({ url }));
    } else {
      localStorage.removeItem('service-nav-backend-config');
    }
  }

  // 处理同步消息
  private handleSyncMessage(data: any) {
    if (data.type === 'sync-update') {
      // 通知所有注册的回调
      this.syncCallbacks.forEach(callback => {
        callback(data.payload);
      });
    }
  }

  // 处理 localStorage 变化
  private handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'service-nav-services' || event.key === 'service-nav-categories') {
      if (event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          const type = event.key === 'service-nav-services' ? 'services' : 'categories';
          this.syncCallbacks.forEach(callback => {
            callback({ type, data });
          });
        } catch (error) {
          console.error('解析同步数据失败:', error);
        }
      }
    }
  };

  // 注册同步回调
  onSync(callback: (data: any) => void) {
    this.syncCallbacks.add(callback);
    return () => {
      this.syncCallbacks.delete(callback);
    };
  }

  // 广播数据更新（返回Promise以便跟踪同步状态）
  async broadcastUpdate(type: 'services' | 'categories', data: any): Promise<void> {
    // 通过 BroadcastChannel 广播
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'sync-update',
        payload: { type, data }
      });
    }

    // 同步到后端（防抖）
    if (this.backendUrl) {
      return this.syncToBackend(type, data);
    }
  }

  // 同步到后端
  private syncToBackend(type: 'services' | 'categories', data: any): Promise<void> {
    // 清除之前的定时器
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    // 返回一个Promise用于跟踪同步状态
    return new Promise((resolve, reject) => {
      // 防抖处理，避免频繁请求
      this.syncDebounceTimer = setTimeout(async () => {
        try {
          const endpoint = type === 'services' ? '/api/services' : '/api/categories';
          const response = await fetch(`${this.backendUrl}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorMsg = `同步到后端失败: HTTP ${response.status} ${response.statusText}`;
            console.error(errorMsg);
            reject(new Error(errorMsg));
          } else {
            console.log(`成功同步${type}到后端`);
            resolve();
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          console.error('同步到后端出错:', error);
          reject(new Error(errorMsg));
        }
      }, 500); // 500ms防抖，更快同步
    });
  }

  // 从后端加载数据
  async loadFromBackend(): Promise<{ services: Service[], categories: Category[] } | null> {
    if (!this.backendUrl) {
      console.error('后端URL未配置');
      alert('❌ 后端服务未配置！\n\n请确保后端服务正在运行。');
      return null;
    }

    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        fetch(`${this.backendUrl}/api/services`),
        fetch(`${this.backendUrl}/api/categories`)
      ]);

      if (servicesRes.ok && categoriesRes.ok) {
        const services = await servicesRes.json();
        const categories = await categoriesRes.json();
        return { services, categories };
      } else {
        const errorMsg = `从后端加载数据失败: 服务(${servicesRes.status}), 分类(${categoriesRes.status})`;
        console.error(errorMsg);
        alert(`❌ ${errorMsg}\n\n请检查后端服务状态。`);
        return null;
      }
    } catch (error) {
      const errorMsg = `❌ 无法连接到后端服务！\n\n${error instanceof Error ? error.message : '未知错误'}\n\n请启动后端服务:\n./start-backend.sh`;
      console.error('从后端加载数据失败:', error);
      alert(errorMsg);
      return null;
    }
  }

  // 导出数据
  exportData(services: Service[], categories: Category[]) {
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      services,
      categories,
      metadata: {
        servicesCount: services.length,
        categoriesCount: categories.length,
        exportedFrom: window.location.hostname
      }
    };
  }

  // 导入数据
  importData(data: any): { services: Service[], categories: Category[] } | null {
    try {
      if (data.version !== '1.0') {
        throw new Error('不支持的数据版本');
      }

      const { services, categories } = data;
      
      // 验证数据结构
      if (!Array.isArray(services) || !Array.isArray(categories)) {
        throw new Error('无效的数据格式');
      }

      return { services, categories };
    } catch (error) {
      console.error('导入数据失败:', error);
      return null;
    }
  }

  // 清理资源
  destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    window.removeEventListener('storage', this.handleStorageChange);
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
  }
}

// 创建单例实例
export const dataSyncService = new DataSyncService();