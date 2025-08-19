import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { DraggableServiceGrid } from '@/components/service/DraggableServiceGrid';
import { VirtualizedServiceGrid } from '@/components/service/VirtualizedServiceGrid';
import { AddServiceDialog } from '@/components/dialogs/AddServiceDialog';
import { ImportExportDialog } from '@/components/dialogs/ImportExportDialog';
import { ShortcutsDialog } from '@/components/dialogs/ShortcutsDialog';
import { HealthCheckDashboard } from '@/components/HealthCheckDashboard';
import { BatchOperations } from '@/components/BatchOperations';
import { CodeSplitBoundary } from '@/components/performance/LazyComponentLoader';
import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';
import type { Service, Category, ViewMode } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePerformanceMonitor, usePerformanceBudget } from '@/hooks/usePerformanceMonitor';
import { preloadResources } from '@/hooks/useLazyLoading';

// Default categories
const defaultCategories: Category[] = [
  { id: '1', name: '开发环境', icon: 'code', count: 0 },
  { id: '2', name: '测试环境', icon: 'flask', count: 0 },
  { id: '3', name: '生产环境', icon: 'server', count: 0 },
  { id: '4', name: '监控系统', icon: 'activity', count: 0 },
  { id: '5', name: '数据库', icon: 'database', count: 0 },
];

// Sample services for demo
const sampleServices: Service[] = [
  {
    id: '1',
    name: '开发API',
    url: 'http://192.168.1.100:3000',
    description: '主开发API服务器',
    category: '1',
    status: 'online',
    tags: ['API', 'REST'],
  },
  {
    id: '2',
    name: '测试数据库',
    url: 'http://192.168.1.101:5432',
    description: 'PostgreSQL测试数据库',
    category: '2',
    status: 'online',
    tags: ['数据库', 'PostgreSQL'],
  },
  {
    id: '3',
    name: '生产服务器',
    url: 'https://api.production.local',
    description: '生产环API端点',
    category: '3',
    status: 'online',
    tags: ['生产环境', 'API'],
  },
  {
    id: '4',
    name: 'Grafana监控面板',
    url: 'http://192.168.1.110:3000',
    description: '系统监控仪表板',
    category: '4',
    status: 'online',
    tags: ['监控', '指标'],
  },
];

function App() {
  const [services, setServices] = useLocalStorage<Service[]>('nav_services', sampleServices);
  const [categories, setCategories] = useLocalStorage<Category[]>('nav_categories', defaultCategories);
  const [mode, setMode] = useState<ViewMode>('view');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [useVirtualization, setUseVirtualization] = useState(services.length > 50);

  // 性能监控
  const { startMeasure, endMeasure } = usePerformanceMonitor('App');
  const { violations } = usePerformanceBudget({
    renderTime: 16, // 60fps
    memoryUsage: 100, // 100MB
    fps: 55,
  });

  // Update category counts
  useEffect(() => {
    const updatedCategories = categories.map((category) => ({
      ...category,
      count: services.filter((service) => service.category === category.id).length,
    }));
    setCategories(updatedCategories);
  }, [services]);

  // Theme management
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Filter services based on search and category
  const filteredServices = useMemo(() => {
    startMeasure();
    let filtered = services;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((service) => service.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(query) ||
          service.description?.toLowerCase().includes(query) ||
          service.url.toLowerCase().includes(query) ||
          service.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    endMeasure();
    return filtered;
  }, [services, selectedCategory, searchQuery, startMeasure, endMeasure]);

  // 根据服务数量自动切换虚拟化
  useEffect(() => {
    setUseVirtualization(filteredServices.length > 50);
  }, [filteredServices.length]);

  // 预加载关键资源
  useEffect(() => {
    const preloadCriticalResources = async () => {
      const resources = [
        // 预加载图标字体等关键资源
        { src: '/icons/lucide.woff2', type: 'style' as const },
      ].filter(resource => resource.src);

      if (resources.length > 0) {
        try {
          await preloadResources(resources, { priority: true });
        } catch (error) {
          console.warn('Failed to preload critical resources:', error);
        }
      }
    };

    preloadCriticalResources();
  }, []);

  // 性能预算违规警告
  useEffect(() => {
    if (violations.length > 0) {
      console.warn('Performance budget violations:', violations);
    }
  }, [violations]);

  const handleAddService = (newService: Omit<Service, 'id'>) => {
    const service: Service = {
      ...newService,
      id: Date.now().toString(),
    };
    
    if (editingService) {
      setServices(services.map((s) => (s.id === editingService.id ? { ...service, id: editingService.id } : s)));
      setEditingService(null);
    } else {
      setServices([...services, service]);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleDeleteService = (id: string) => {
    if (window.confirm('确定要删除这个服务吗？')) {
      setServices(services.filter((s) => s.id !== id));
    }
  };

  const handleServiceClick = (service: Service) => {
    if (mode === 'view') {
      window.open(service.url, '_blank');
    }
  };

  const handleAddCategory = () => {
    const name = prompt('输入分类名称：');
    if (name) {
      const newCategory: Category = {
        id: Date.now().toString(),
        name,
        count: 0,
      };
      setCategories([...categories, newCategory]);
    }
  };

  const handleEditCategory = (category: Category) => {
    const name = prompt('编辑分类名称：', category.name);
    if (name && name !== category.name) {
      setCategories(categories.map((c) => (c.id === category.id ? { ...c, name } : c)));
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('确定要删除这个分类吗？')) {
      setCategories(categories.filter((c) => c.id !== categoryId));
      // Move services from deleted category to first available category
      const firstCategory = categories.find((c) => c.id !== categoryId);
      if (firstCategory) {
        setServices(
          services.map((s) =>
            s.category === categoryId ? { ...s, category: firstCategory.id } : s
          )
        );
      }
    }
  };

  const handleImport = (importedServices: Service[], importedCategories: Category[]) => {
    setServices(importedServices);
    setCategories(importedCategories);
  };

  const handleServiceReorder = (reorderedServices: Service[]) => {
    setServices(reorderedServices);
  };

  // Batch operations
  const handleSelectService = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedServiceIds);
    if (selected) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedServiceIds(newSelection);
  };

  const handleSelectAll = () => {
    setSelectedServiceIds(new Set(filteredServices.map(s => s.id)));
  };

  const handleClearSelection = () => {
    setSelectedServiceIds(new Set());
    setBatchMode(false);
  };

  const handleBatchDelete = () => {
    if (window.confirm(`确定要删除选中的 ${selectedServiceIds.size} 个服务吗？`)) {
      setServices(services.filter(s => !selectedServiceIds.has(s.id)));
      handleClearSelection();
    }
  };

  const handleBatchMove = (categoryId: string) => {
    setServices(services.map(s => 
      selectedServiceIds.has(s.id) ? { ...s, category: categoryId } : s
    ));
    handleClearSelection();
  };

  // 键盘快捷键
  useKeyboardShortcuts({
    onSearch: () => {
      // 聚焦搜索框
      document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    },
    onNewService: () => {
      if (mode === 'edit') {
        setEditingService(null);
        setDialogOpen(true);
      }
    },
    onToggleEditMode: () => {
      setMode(mode === 'view' ? 'edit' : 'view');
    },
    onToggleDarkMode: () => {
      setIsDarkMode(!isDarkMode);
    },
    onImportExport: () => {
      setImportExportOpen(true);
    },
    onSelectAll: () => {
      if (batchMode) {
        handleSelectAll();
      }
    },
    onDelete: () => {
      if (batchMode && selectedServiceIds.size > 0) {
        handleBatchDelete();
      }
    },
    onEscape: () => {
      if (dialogOpen) setDialogOpen(false);
      if (importExportOpen) setImportExportOpen(false);
      if (shortcutsDialogOpen) setShortcutsDialogOpen(false);
      if (batchMode) handleClearSelection();
    },
  });

  // 显示快捷键帮助（按 ? 键）
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShortcutsDialogOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <Layout
        header={
          <Header
            mode={mode}
            onModeChange={setMode}
            onSearch={setSearchQuery}
            searchQuery={searchQuery}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            isDarkMode={isDarkMode}
            onThemeToggle={() => setIsDarkMode(!isDarkMode)}
            onImportExport={() => setImportExportOpen(true)}
            batchMode={batchMode}
            onBatchModeToggle={() => {
              setBatchMode(!batchMode);
              if (batchMode) {
                handleClearSelection();
              }
            }}
          />
        }
        sidebar={
          <Sidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            mode={mode}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        }
        sidebarOpen={sidebarOpen}
      >
        <div className="space-y-6">
          <HealthCheckDashboard services={services} />
          {batchMode && mode === 'edit' && (
            <BatchOperations
              services={filteredServices}
              categories={categories}
              selectedIds={selectedServiceIds}
              onSelectService={handleSelectService}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBatchDelete={handleBatchDelete}
              onBatchMove={handleBatchMove}
            />
          )}
          <CodeSplitBoundary>
            {useVirtualization ? (
              <VirtualizedServiceGrid
                services={filteredServices}
                mode={mode}
                onAddService={() => {
                  setEditingService(null);
                  setDialogOpen(true);
                }}
                onEditService={handleEditService}
                onDeleteService={handleDeleteService}
                onServiceClick={handleServiceClick}
                selectedIds={selectedServiceIds}
                onSelectService={handleSelectService}
                batchMode={batchMode}
              />
            ) : (
              <DraggableServiceGrid
                services={filteredServices}
                mode={mode}
                onAddService={() => {
                  setEditingService(null);
                  setDialogOpen(true);
                }}
                onEditService={handleEditService}
                onDeleteService={handleDeleteService}
                onServiceClick={handleServiceClick}
                onReorder={handleServiceReorder}
              />
            )}
          </CodeSplitBoundary>
        </div>
      </Layout>

      <AddServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        onSubmit={handleAddService}
        editingService={editingService}
      />

      <ImportExportDialog
        open={importExportOpen}
        onOpenChange={setImportExportOpen}
        services={services}
        categories={categories}
        onImport={handleImport}
      />

      <ShortcutsDialog
        open={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
      />

      <PerformanceDashboard enabled={import.meta.env.DEV} />
    </>
  );
}

export default App;