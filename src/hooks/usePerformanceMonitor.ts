import { useEffect, useRef, useCallback, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage?: number;
  fps?: number;
}

export function usePerformanceMonitor(componentName: string, enabled = import.meta.env.DEV) {
  const renderStart = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const lastRender = useRef<number>(performance.now());

  const startMeasure = useCallback(() => {
    if (!enabled) return;
    renderStart.current = performance.now();
  }, [enabled]);

  const endMeasure = useCallback(() => {
    if (!enabled) return;
    
    const renderTime = performance.now() - renderStart.current;
    renderCount.current += 1;
    
    if (enabled) {
      console.log(`[Performance] ${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
      
      // 警告慢渲染
      if (renderTime > 16) {
        console.warn(`[Performance] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    }
    
    lastRender.current = performance.now();
  }, [enabled, componentName]);

  // 自动测量每次渲染
  useEffect(() => {
    startMeasure();
    return endMeasure;
  });

  return { startMeasure, endMeasure, renderCount: renderCount.current };
}

export function useFPSMonitor(enabled = false) {
  const [fps, setFps] = useState<number>(0);
  const frameCount = useRef<number>(0);
  const lastTime = useRef<number>(performance.now());
  const animationId = useRef<number>(0);

  const measureFPS = useCallback(() => {
    if (!enabled) return;

    const currentTime = performance.now();
    frameCount.current++;

    if (currentTime - lastTime.current >= 1000) {
      setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)));
      frameCount.current = 0;
      lastTime.current = currentTime;
    }

    animationId.current = requestAnimationFrame(measureFPS);
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      measureFPS();
    }

    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [enabled, measureFPS]);

  return fps;
}

export function useMemoryMonitor(enabled = false, interval = 5000) {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !('memory' in performance)) return;

    const updateMemoryInfo = () => {
      const memory = (performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      });
    };

    updateMemoryInfo();
    const intervalId = setInterval(updateMemoryInfo, interval);

    return () => clearInterval(intervalId);
  }, [enabled, interval]);

  return memoryInfo;
}

// 组件渲染次数监控
export function useRenderCount(componentName: string, enabled = import.meta.env.DEV) {
  const renderCount = useRef<number>(0);
  const mountTime = useRef<number>(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    if (enabled) {
      console.log(`[Render Count] ${componentName}: ${renderCount.current} renders in ${(performance.now() - mountTime.current).toFixed(2)}ms`);
    }
  });

  return renderCount.current;
}

// 长任务检测
export function useLongTaskDetection(threshold = 50, enabled = true) {
  const [longTasks, setLongTasks] = useState<Array<{ duration: number; startTime: number }>>([]);

  useEffect(() => {
    if (!enabled || !('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > threshold) {
          setLongTasks((prev) => [
            ...prev.slice(-9), // 保持最近10个长任务
            { duration: entry.duration, startTime: entry.startTime },
          ]);
          console.warn(`[Long Task] Duration: ${entry.duration.toFixed(2)}ms at ${entry.startTime.toFixed(2)}ms`);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('Long task detection not supported');
    }

    return () => observer.disconnect();
  }, [threshold, enabled]);

  return longTasks;
}

// 性能预算监控
export function usePerformanceBudget(
  budget: {
    renderTime?: number;
    memoryUsage?: number;
    fps?: number;
  },
  enabled = true
) {
  const [violations, setViolations] = useState<string[]>([]);
  const fps = useFPSMonitor(enabled);
  const memoryInfo = useMemoryMonitor(enabled);

  const checkBudget = useCallback((renderTime?: number) => {
    if (!enabled) return;

    const newViolations: string[] = [];

    if (budget.renderTime && renderTime && renderTime > budget.renderTime) {
      newViolations.push(`Render time exceeded: ${renderTime.toFixed(2)}ms > ${budget.renderTime}ms`);
    }

    if (budget.fps && fps > 0 && fps < budget.fps) {
      newViolations.push(`FPS below target: ${fps} < ${budget.fps}`);
    }

    if (budget.memoryUsage && memoryInfo) {
      const usageMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
      if (usageMB > budget.memoryUsage) {
        newViolations.push(`Memory usage exceeded: ${usageMB.toFixed(2)}MB > ${budget.memoryUsage}MB`);
      }
    }

    if (newViolations.length > 0) {
      setViolations(newViolations);
      console.warn('[Performance Budget] Violations:', newViolations);
    } else {
      setViolations([]);
    }
  }, [budget, enabled, fps, memoryInfo]);

  return { violations, checkBudget };
}

// 网络性能监控
export function useNetworkMonitor(enabled = true) {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !('connection' in navigator)) return;

    const connection = (navigator as any).connection;
    if (!connection) return;

    const updateNetworkInfo = () => {
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });
    };

    updateNetworkInfo();
    connection.addEventListener('change', updateNetworkInfo);

    return () => connection.removeEventListener('change', updateNetworkInfo);
  }, [enabled]);

  return networkInfo;
}

// 综合性能监控 Hook
export function usePerformanceMetrics(componentName: string, enabled = import.meta.env.DEV) {
  const { renderCount } = usePerformanceMonitor(componentName, enabled);
  const fps = useFPSMonitor(enabled);
  const memoryInfo = useMemoryMonitor(enabled);
  const longTasks = useLongTaskDetection(50, enabled);
  const networkInfo = useNetworkMonitor(enabled);

  const getMetrics = useCallback((): PerformanceMetrics => {
    return {
      renderTime: 0, // Will be updated by individual render measurements
      componentCount: renderCount,
      memoryUsage: memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : undefined,
      fps: fps || undefined,
    };
  }, [renderCount, memoryInfo, fps]);

  return {
    metrics: getMetrics(),
    fps,
    memoryInfo,
    longTasks,
    networkInfo,
    renderCount,
  };
}