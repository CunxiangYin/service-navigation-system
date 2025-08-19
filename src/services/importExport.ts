// Import/Export service for configuration management
import type { Service, Category } from '@/types';

export interface ExportData {
  version: string;
  exportDate: string;
  services: Service[];
  categories: Category[];
  metadata?: {
    totalServices: number;
    totalCategories: number;
    exportedBy?: string;
  };
}

class ImportExportService {
  private readonly currentVersion = '1.0.0';

  // Export configuration to JSON
  exportConfig(services: Service[], categories: Category[]): string {
    const exportData: ExportData = {
      version: this.currentVersion,
      exportDate: new Date().toISOString(),
      services,
      categories,
      metadata: {
        totalServices: services.length,
        totalCategories: categories.length,
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Download configuration as JSON file
  downloadConfig(services: Service[], categories: Category[], filename: string = 'service-nav-config') {
    const jsonData = this.exportConfig(services, categories);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}-${timestamp}.json`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fullFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Validate import data
  validateImportData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check basic structure
    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format: expected JSON object');
      return { valid: false, errors };
    }

    // Check version compatibility
    if (!data.version) {
      errors.push('Missing version field');
    } else if (!this.isVersionCompatible(data.version)) {
      errors.push(`Incompatible version: ${data.version}. Current version: ${this.currentVersion}`);
    }

    // Check required fields
    if (!Array.isArray(data.services)) {
      errors.push('Invalid or missing services array');
    } else {
      // Validate each service
      data.services.forEach((service: any, index: number) => {
        if (!service.id || !service.name || !service.url || !service.category) {
          errors.push(`Invalid service at index ${index}: missing required fields`);
        }
      });
    }

    if (!Array.isArray(data.categories)) {
      errors.push('Invalid or missing categories array');
    } else {
      // Validate each category
      data.categories.forEach((category: any, index: number) => {
        if (!category.id || !category.name) {
          errors.push(`Invalid category at index ${index}: missing required fields`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Import configuration from JSON
  async importConfig(jsonString: string): Promise<{
    success: boolean;
    data?: ExportData;
    errors?: string[];
  }> {
    try {
      const data = JSON.parse(jsonString);
      const validation = this.validateImportData(data);

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Process and clean the data
      const processedData: ExportData = {
        version: data.version,
        exportDate: data.exportDate,
        services: this.processServices(data.services),
        categories: this.processCategories(data.categories),
        metadata: data.metadata,
      };

      return {
        success: true,
        data: processedData,
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  // Import from file
  async importFromFile(file: File): Promise<{
    success: boolean;
    data?: ExportData;
    errors?: string[];
  }> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const result = await this.importConfig(content);
        resolve(result);
      };

      reader.onerror = () => {
        resolve({
          success: false,
          errors: ['Failed to read file'],
        });
      };

      reader.readAsText(file);
    });
  }

  // Process services to ensure they have all required fields
  private processServices(services: any[]): Service[] {
    return services.map(service => ({
      id: service.id || Date.now().toString(),
      name: service.name || 'Unnamed Service',
      url: service.url || '',
      description: service.description,
      category: service.category || '1',
      icon: service.icon,
      status: service.status || 'online',
      tags: Array.isArray(service.tags) ? service.tags : [],
      lastUpdated: service.lastUpdated ? new Date(service.lastUpdated) : new Date(),
    }));
  }

  // Process categories to ensure they have all required fields
  private processCategories(categories: any[]): Category[] {
    return categories.map(category => ({
      id: category.id || Date.now().toString(),
      name: category.name || 'Unnamed Category',
      icon: category.icon,
      color: category.color,
      count: category.count || 0,
    }));
  }

  // Check if version is compatible
  private isVersionCompatible(version: string): boolean {
    const [major] = version.split('.');
    const [currentMajor] = this.currentVersion.split('.');
    return major === currentMajor;
  }

  // Merge imported data with existing data
  mergeData(
    existingServices: Service[],
    existingCategories: Category[],
    importedServices: Service[],
    importedCategories: Category[],
    strategy: 'replace' | 'merge' | 'append' = 'replace'
  ): {
    services: Service[];
    categories: Category[];
  } {
    switch (strategy) {
      case 'replace':
        return {
          services: importedServices,
          categories: importedCategories,
        };

      case 'merge':
        // Merge by ID - imported data takes precedence
        const serviceMap = new Map(existingServices.map(s => [s.id, s]));
        importedServices.forEach(s => serviceMap.set(s.id, s));

        const categoryMap = new Map(existingCategories.map(c => [c.id, c]));
        importedCategories.forEach(c => categoryMap.set(c.id, c));

        return {
          services: Array.from(serviceMap.values()),
          categories: Array.from(categoryMap.values()),
        };

      case 'append':
        // Generate new IDs for imported items to avoid conflicts
        const newServices = importedServices.map(s => ({
          ...s,
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));

        const categoryIdMap = new Map<string, string>();
        const newCategories = importedCategories.map(c => {
          const newId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          categoryIdMap.set(c.id, newId);
          return { ...c, id: newId };
        });

        // Update service category references
        newServices.forEach(s => {
          if (categoryIdMap.has(s.category)) {
            s.category = categoryIdMap.get(s.category)!;
          }
        });

        return {
          services: [...existingServices, ...newServices],
          categories: [...existingCategories, ...newCategories],
        };
    }
  }

  // Generate sample configuration for demo/testing
  generateSampleConfig(): ExportData {
    const sampleCategories: Category[] = [
      { id: 'cat-1', name: 'Development', icon: 'code', color: '#3B82F6' },
      { id: 'cat-2', name: 'Production', icon: 'server', color: '#10B981' },
      { id: 'cat-3', name: 'Monitoring', icon: 'activity', color: '#F59E0B' },
    ];

    const sampleServices: Service[] = [
      {
        id: 'srv-1',
        name: 'API Gateway',
        url: 'http://192.168.1.100:8080',
        description: 'Main API gateway for microservices',
        category: 'cat-1',
        status: 'online',
        tags: ['API', 'Gateway', 'Development'],
      },
      {
        id: 'srv-2',
        name: 'Database Server',
        url: 'http://192.168.1.101:5432',
        description: 'PostgreSQL database server',
        category: 'cat-2',
        status: 'online',
        tags: ['Database', 'PostgreSQL', 'Production'],
      },
      {
        id: 'srv-3',
        name: 'Monitoring Dashboard',
        url: 'http://192.168.1.102:3000',
        description: 'Grafana monitoring dashboard',
        category: 'cat-3',
        status: 'online',
        tags: ['Monitoring', 'Grafana', 'Dashboard'],
      },
    ];

    return {
      version: this.currentVersion,
      exportDate: new Date().toISOString(),
      services: sampleServices,
      categories: sampleCategories,
      metadata: {
        totalServices: sampleServices.length,
        totalCategories: sampleCategories.length,
        exportedBy: 'Sample Generator',
      },
    };
  }
}

// Export singleton instance
export const importExportService = new ImportExportService();