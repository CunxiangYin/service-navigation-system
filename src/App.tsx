import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { DraggableServiceGrid } from '@/components/service/DraggableServiceGrid';
import { VirtualizedServiceGrid } from '@/components/service/VirtualizedServiceGrid';
import { AddServiceDialog } from '@/components/dialogs/AddServiceDialog';
import { ImportExportDialog } from '@/components/dialogs/ImportExportDialog';
import { ShortcutsDialog } from '@/components/dialogs/ShortcutsDialog';
import { SyncSettingsDialog } from '@/components/dialogs/SyncSettingsDialog';
import { HealthCheckDashboard } from '@/components/HealthCheckDashboard';
import { BatchOperations } from '@/components/BatchOperations';
import { CodeSplitBoundary } from '@/components/performance/LazyComponentLoader';
import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';
import { BackendStatus } from '@/components/BackendStatus';
import { EmptyState } from '@/components/EmptyState';
import type { Service, Category, ViewMode } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePerformanceMonitor, usePerformanceBudget } from '@/hooks/usePerformanceMonitor';
import { preloadResources } from '@/hooks/useLazyLoading';
import { dataSyncService } from '@/services/dataSync';
import { useToast } from '@/hooks/useToast';
import { Toaster } from '@/components/ui/toaster';

// 空的初始数据，将从后端加载
const emptyCategories: Category[] = [];
const emptyServices: Service[] = [];

function App() {
  const [services, setServicesLocal] = useLocalStorage<Service[]>('service-nav-services', emptyServices);
  const [categories, setCategoriesLocal] = useLocalStorage<Category[]>('service-nav-categories', emptyCategories);
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
  const [syncSettingsOpen, setSyncSettingsOpen] = useState(false);
  const [useVirtualization, setUseVirtualization] = useState(services.length > 50);
  const { toast } = useToast();

  // 包装 setServices 以支持数据同步
  const setServices = async (newServices: Service[] | ((prev: Service[]) => Service[])) => {
    const actualServices = typeof newServices === 'function' ? newServices(services) : newServices;
    
    // 先尝试同步到后端，成功后才更新本地
    try {
      await dataSyncService.broadcastUpdate('services', actualServices);
      setServicesLocal(actualServices);
      
      // 显示成功提示
      toast({
        variant: "success",
        title: "✅ 保存成功",
        description: "数据已成功同步到后端服务器",
      });
    } catch (error) {
      console.error('更新服务失败:', error);
      
      // 显示错误提示
      toast({
        variant: "destructive",
        title: "❌ 保存失败",
        description: error instanceof Error ? error.message : "无法连接到后端服务",
      });
      
      // 不更新本地存储，保持数据一致性
    }
  };

  // 包装 setCategories 以支持数据同步
  const setCategories = async (newCategories: Category[] | ((prev: Category[]) => Category[])) => {
    const actualCategories = typeof newCategories === 'function' ? newCategories(categories) : newCategories;
    
    // 先尝试同步到后端，成功后才更新本地
    try {
      await dataSyncService.broadcastUpdate('categories', actualCategories);
      setCategoriesLocal(actualCategories);
      
      // 显示成功提示
      toast({
        variant: "success",
        title: "✅ 保存成功",
        description: "分类已成功同步到后端服务器",
      });
    } catch (error) {
      console.error('更新分类失败:', error);
      
      // 显示错误提示
      toast({
        variant: "destructive",
        title: "❌ 保存失败",
        description: error instanceof Error ? error.message : "无法连接到后端服务",
      });
      
      // 不更新本地存储，保持数据一致性
    }
  };

  // 性能监控
  const { startMeasure, endMeasure } = usePerformanceMonitor('App');
  const { violations } = usePerformanceBudget({
    renderTime: 16, // 60fps
    memoryUsage: 100, // 100MB
    fps: 55,
  });

  // 监听数据同步
  useEffect(() => {
    const unsubscribe = dataSyncService.onSync((data) => {
      if (data.type === 'services') {
        setServicesLocal(data.data);
      } else if (data.type === 'categories') {
        setCategoriesLocal(data.data);
      }
    });

    // 从后端加载数据 - 这是唯一的数据源
    const loadData = async () => {
      try {
        const backendData = await dataSyncService.loadFromBackend();
        if (backendData) {
          setServicesLocal(backendData.services || []);
          setCategoriesLocal(backendData.categories || []);
          console.log('从后端加载数据成功', backendData);
        } else {
          // 如果后端没有数据，使用空数据
          setServicesLocal([]);
          setCategoriesLocal([]);
        }
      } catch (error) {
        console.error('加载后端数据失败:', error);
        // 保持空数据，不使用任何默认值
        setServicesLocal([]);
        setCategoriesLocal([]);
      }
    };

    loadData();

    return () => {
      unsubscribe();
    };
  }, []);

  // Update category counts
  useEffect(() => {
    const updatedCategories = categories.map((category) => ({
      ...category,
      count: services.filter((service) => service.category === category.id).length,
    }));
    setCategoriesLocal(updatedCategories);
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
            onSyncSettings={() => setSyncSettingsOpen(true)}
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
          <BackendStatus />
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
            {services.length === 0 || categories.length === 0 ? (
              <EmptyState
                hasCategories={categories.length > 0}
                onAddCategory={handleAddCategory}
                onAddService={() => {
                  setEditingService(null);
                  setDialogOpen(true);
                }}
                mode={mode}
              />
            ) : useVirtualization ? (
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

      <SyncSettingsDialog
        open={syncSettingsOpen}
        onOpenChange={setSyncSettingsOpen}
      />

      <PerformanceDashboard enabled={import.meta.env.DEV} />
      
      <Toaster />
    </>
  );
}

export default App;