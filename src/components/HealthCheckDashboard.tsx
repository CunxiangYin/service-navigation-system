import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { healthCheckService } from '@/services/healthCheck';
import type { HealthStatus } from '@/services/healthCheck';
import type { Service } from '@/types';
import { RefreshCw, Activity, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthCheckDashboardProps {
  services: Service[];
}

export function HealthCheckDashboard({ services }: HealthCheckDashboardProps) {
  const [healthStatuses, setHealthStatuses] = useState<Map<string, HealthStatus>>(new Map());
  const [isChecking, setIsChecking] = useState(false);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(false);

  useEffect(() => {
    // Load existing health statuses
    setHealthStatuses(healthCheckService.getAllStatuses());

    // Subscribe to health check updates
    const unsubscribe = healthCheckService.subscribe((status) => {
      setHealthStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(status.serviceId, status);
        return newMap;
      });
    });

    return () => {
      unsubscribe();
      if (autoCheckEnabled) {
        healthCheckService.stopAutoCheck();
      }
    };
  }, []);

  const handleCheckAll = async () => {
    setIsChecking(true);
    const serviceData = services.map(s => ({ id: s.id, url: s.url }));
    await healthCheckService.checkAllServices(serviceData);
    setIsChecking(false);
  };

  const toggleAutoCheck = () => {
    if (autoCheckEnabled) {
      healthCheckService.stopAutoCheck();
      setAutoCheckEnabled(false);
    } else {
      const serviceData = services.map(s => ({ id: s.id, url: s.url }));
      healthCheckService.startAutoCheck(serviceData);
      setAutoCheckEnabled(true);
    }
  };

  const stats = {
    total: services.length,
    online: 0,
    offline: 0,
    error: 0,
    unchecked: 0
  };

  services.forEach(service => {
    const status = healthStatuses.get(service.id);
    if (!status) {
      stats.unchecked++;
    } else {
      switch (status.status) {
        case 'online':
          stats.online++;
          break;
        case 'offline':
          stats.offline++;
          break;
        case 'error':
          stats.error++;
          break;
      }
    }
  });

  const uptime = stats.total > 0 ? (stats.online / stats.total) * 100 : 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            服务健康监控
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={autoCheckEnabled ? "secondary" : "outline"}
              size="sm"
              onClick={toggleAutoCheck}
            >
              <Clock className="h-4 w-4 mr-2" />
              {autoCheckEnabled ? '自动检查: 开' : '自动检查: 关'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckAll}
              disabled={isChecking}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isChecking && "animate-spin")} />
              检查全部
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">服务总数</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">在线</p>
              <p className="text-2xl font-bold text-green-600">{stats.online}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">离线</p>
              <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">错误</p>
              <p className="text-2xl font-bold text-orange-600">{stats.error}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">可用率</p>
              <p className="text-2xl font-bold">{uptime.toFixed(1)}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>整体健康度</span>
              <span>{uptime.toFixed(1)}%</span>
            </div>
            <Progress value={uptime} className="h-2" />
          </div>

          {stats.unchecked > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-600 dark:text-yellow-400">
                还有 {stats.unchecked} 个服务未检查
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}