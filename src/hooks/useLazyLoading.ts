import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useLazyLoading(options: UseLazyLoadingOptions = {}) {
  const { threshold = 0.1, rootMargin = '50px' } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [threshold, rootMargin, hasIntersected]);

  return {
    targetRef,
    isIntersecting,
    hasIntersected,
  };
}

interface UseLazyImageOptions {
  src: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

export function useLazyImage(options: UseLazyImageOptions) {
  const { src, placeholder, threshold = 0.1, rootMargin = '50px' } = options;
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { targetRef, hasIntersected } = useLazyLoading({ threshold, rootMargin });

  useEffect(() => {
    if (!hasIntersected || !src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setIsError(false);
    };
    img.onerror = () => {
      setIsError(true);
      setIsLoaded(false);
    };
    img.src = src;
  }, [hasIntersected, src]);

  return {
    targetRef,
    imageSrc,
    isLoaded,
    isError,
    hasIntersected,
  };
}

// 批量懒加载管理器
export class LazyLoadManager {
  private static instance: LazyLoadManager;
  private observer: IntersectionObserver | null = null;
  private callbacks = new Map<Element, () => void>();

  private constructor() {
    this.init();
  }

  static getInstance(): LazyLoadManager {
    if (!LazyLoadManager.instance) {
      LazyLoadManager.instance = new LazyLoadManager();
    }
    return LazyLoadManager.instance;
  }

  private init() {
    if (typeof window === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const callback = this.callbacks.get(entry.target);
            if (callback) {
              callback();
              this.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );
  }

  observe(element: Element, callback: () => void) {
    if (!this.observer) return;

    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element) {
    if (!this.observer) return;

    this.observer.unobserve(element);
    this.callbacks.delete(element);
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.callbacks.clear();
    }
  }
}

// 预加载资源
export function preloadResource(src: string, type: 'image' | 'script' | 'style' = 'image'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (type === 'image') {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    } else if (type === 'script') {
      const script = document.createElement('script');
      script.onload = () => resolve();
      script.onerror = reject;
      script.src = src;
      document.head.appendChild(script);
    } else if (type === 'style') {
      const link = document.createElement('link');
      link.onload = () => resolve();
      link.onerror = reject;
      link.rel = 'stylesheet';
      link.href = src;
      document.head.appendChild(link);
    }
  });
}

// 批量预加载
export async function preloadResources(
  resources: Array<{ src: string; type?: 'image' | 'script' | 'style' }>,
  options: { concurrency?: number; priority?: boolean } = {}
): Promise<void> {
  const { concurrency = 3, priority = false } = options;

  if (priority) {
    // 高优先级：串行加载
    for (const resource of resources) {
      try {
        await preloadResource(resource.src, resource.type);
      } catch (error) {
        console.warn(`Failed to preload resource: ${resource.src}`, error);
      }
    }
  } else {
    // 普通优先级：并发加载
    const chunks = [];
    for (let i = 0; i < resources.length; i += concurrency) {
      chunks.push(resources.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map((resource) => preloadResource(resource.src, resource.type))
      );
    }
  }
}

// React Hook for resource preloading
export function usePreloadResources(
  resources: Array<{ src: string; type?: 'image' | 'script' | 'style' }>,
  options: { enabled?: boolean; concurrency?: number; priority?: boolean } = {}
) {
  const { enabled = true, concurrency = 3, priority = false } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const preload = useCallback(async () => {
    if (!enabled || resources.length === 0) return;

    setIsLoading(true);
    setErrors([]);

    try {
      await preloadResources(resources, { concurrency, priority });
      setIsLoaded(true);
    } catch (error) {
      setErrors((prev) => [...prev, String(error)]);
    } finally {
      setIsLoading(false);
    }
  }, [resources, enabled, concurrency, priority]);

  useEffect(() => {
    preload();
  }, [preload]);

  return {
    isLoading,
    isLoaded,
    errors,
    preload,
  };
}