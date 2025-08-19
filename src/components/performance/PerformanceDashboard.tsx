import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  usePerformanceMetrics,
  useFPSMonitor,
  useMemoryMonitor,
  useLongTaskDetection,
  useNetworkMonitor,
} from '@/hooks/usePerformanceMonitor';
import {
  Activity,
  HardDrive,
  Wifi,
  Clock,
  AlertTriangle,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface PerformanceDashboardProps {
  enabled?: boolean;
}

export function PerformanceDashboard({ enabled = import.meta.env.DEV }: PerformanceDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fps = useFPSMonitor(enabled && isOpen);
  const memoryInfo = useMemoryMonitor(enabled && isOpen);
  const longTasks = useLongTaskDetection(50, enabled && isOpen);
  const networkInfo = useNetworkMonitor(enabled && isOpen);
  const metrics = usePerformanceMetrics('App', enabled && isOpen);

  if (!enabled) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-600';
    if (fps >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryUsagePercent = () => {
    if (!memoryInfo) return 0;
    return (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="fixed bottom-4 right-4 z-50 gap-2"
          title="性能监控面板"
        >
          <Activity className="h-4 w-4" />
          性能
          {fps > 0 && (
            <Badge variant="secondary" className={getFPSColor(fps)}>
              {fps} FPS
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            性能监控面板
          </DialogTitle>
          <DialogDescription>
            实时监控应用性能指标和资源使用情况
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="memory">内存</TabsTrigger>
            <TabsTrigger value="network">网络</TabsTrigger>
            <TabsTrigger value="tasks">任务</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">帧率</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getFPSColor(fps)}`}>
                    {fps} FPS
                  </div>
                  <p className="text-xs text-muted-foreground">
                    目标: 60 FPS
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">内存使用</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {memoryInfo ? formatBytes(memoryInfo.usedJSHeapSize) : '--'}
                  </div>
                  <Progress 
                    value={getMemoryUsagePercent()} 
                    className="mt-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {getMemoryUsagePercent().toFixed(1)}% 已使用
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">渲染次数</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.renderCount}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    总渲染次数
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">长任务</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {longTasks.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    近期检测到的长任务
                  </p>
                </CardContent>
              </Card>
            </div>

            {networkInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    网络状态
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">连接类型</div>
                      <div className="text-muted-foreground">{networkInfo.effectiveType}</div>
                    </div>
                    <div>
                      <div className="font-medium">下行速度</div>
                      <div className="text-muted-foreground">{networkInfo.downlink} Mbps</div>
                    </div>
                    <div>
                      <div className="font-medium">延迟</div>
                      <div className="text-muted-foreground">{networkInfo.rtt} ms</div>
                    </div>
                    <div>
                      <div className="font-medium">省流模式</div>
                      <div className="text-muted-foreground">
                        {networkInfo.saveData ? '开启' : '关闭'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="memory" className="space-y-4">
            {memoryInfo && (
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>内存详情</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>已使用内存</span>
                        <span>{formatBytes(memoryInfo.usedJSHeapSize)}</span>
                      </div>
                      <Progress value={getMemoryUsagePercent()} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium">总分配内存</div>
                        <div className="text-muted-foreground">
                          {formatBytes(memoryInfo.totalJSHeapSize)}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">内存限制</div>
                        <div className="text-muted-foreground">
                          {formatBytes(memoryInfo.jsHeapSizeLimit)}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">使用率</div>
                        <div className="text-muted-foreground">
                          {getMemoryUsagePercent().toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            {networkInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>网络信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Badge variant={
                          networkInfo.effectiveType === '4g' ? 'default' :
                          networkInfo.effectiveType === '3g' ? 'secondary' : 'outline'
                        }>
                          {networkInfo.effectiveType.toUpperCase()}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">连接类型</p>
                      </div>
                      
                      <div>
                        <div className="text-lg font-semibold">
                          {networkInfo.downlink} Mbps
                        </div>
                        <p className="text-sm text-muted-foreground">下行带宽</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-lg font-semibold">
                          {networkInfo.rtt} ms
                        </div>
                        <p className="text-sm text-muted-foreground">网络延迟</p>
                      </div>
                      
                      <div>
                        <Badge variant={networkInfo.saveData ? 'destructive' : 'default'}>
                          {networkInfo.saveData ? '省流模式' : '正常模式'}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">数据模式</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  长任务监控
                </CardTitle>
              </CardHeader>
              <CardContent>
                {longTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    未检测到长任务 (&gt;50ms)
                  </p>
                ) : (
                  <div className="space-y-2">
                    {longTasks.slice(-10).map((task, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div className="text-sm">
                          任务 #{longTasks.length - index}
                        </div>
                        <div className="flex gap-2 text-sm">
                          <Badge variant="destructive">
                            {task.duration.toFixed(2)}ms
                          </Badge>
                          <span className="text-muted-foreground">
                            @{task.startTime.toFixed(0)}ms
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}