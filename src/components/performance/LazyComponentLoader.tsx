import React, { Suspense, lazy } from 'react';
import type { ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// 懒加载组件的包装器
export function withLazyLoading<T extends Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function WrappedComponent(props: T) {
    return (
      <Suspense fallback={fallback || <ComponentFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// 默认的组件加载占位符
export function ComponentFallback() {
  return (
    <Card className="w-full h-40">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="w-2 h-2 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <div className="flex gap-1 mt-3">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// 网格加载骨架屏
export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ComponentFallback key={index} />
      ))}
    </div>
  );
}

// 列表加载骨架屏
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-16 h-6" />
                <Skeleton className="w-16 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 渐进式图片加载组件
interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function ProgressiveImage({
  src,
  alt,
  placeholder,
  className,
  width,
  height,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* 占位符 */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img 
              src={placeholder} 
              alt={alt}
              className="w-full h-full object-cover blur-sm"
            />
          ) : (
            <Skeleton className="w-full h-full" />
          )}
        </div>
      )}

      {/* 实际图片 */}
      {!isError && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsError(true)}
        />
      )}

      {/* 错误状态 */}
      {isError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
          <span className="text-xs">加载失败</span>
        </div>
      )}
    </div>
  );
}

// 懒加载容器
interface LazyContainerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function LazyContainer({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  className,
}: LazyContainerProps) {
  const [, setIsVisible] = React.useState(false);
  const [hasBeenVisible, setHasBeenVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasBeenVisible]);

  return (
    <div ref={ref} className={className}>
      {hasBeenVisible ? children : (fallback || <ComponentFallback />)}
    </div>
  );
}

// 代码分割边界
interface CodeSplitBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

export class CodeSplitBoundary extends React.Component<
  CodeSplitBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: CodeSplitBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Code split boundary error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Card className="w-full">
            <CardContent className="p-4 text-center">
              <div className="text-muted-foreground">
                <p>组件加载失败</p>
                <button
                  onClick={() => this.setState({ hasError: false })}
                  className="mt-2 text-primary hover:underline"
                >
                  重试
                </button>
              </div>
            </CardContent>
          </Card>
        )
      );
    }

    return this.props.children;
  }
}