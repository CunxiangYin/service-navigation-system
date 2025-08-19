// Type definitions
type ViewMode = 'view' | 'edit';

interface Service {
  id: string;
  name: string;
  url: string;
  description?: string;
  category: string;
  icon?: string;
  status?: 'online' | 'offline' | 'maintenance' | 'checking' | 'error' | 'warning';
  tags?: string[];
  lastUpdated?: Date;
  healthCheck?: {
    lastChecked?: Date;
    responseTime?: number;
    error?: string;
  };
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  count?: number;
}

interface AppState {
  services: Service[];
  categories: Category[];
  mode: ViewMode;
  searchQuery: string;
  selectedCategory: string | null;
  loading: boolean;
  error: string | null;
}

// Export all types
export type { ViewMode, Service, Category, AppState };