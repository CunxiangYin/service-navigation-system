import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Cloud, Check, X } from 'lucide-react';
import { dataSyncService } from '@/services/dataSync';

interface SyncSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncSettingsDialog({ open, onOpenChange }: SyncSettingsDialogProps) {
  const [backendUrl, setBackendUrl] = useState(() => {
    const config = localStorage.getItem('service-nav-backend-config');
    if (config) {
      try {
        return JSON.parse(config).url || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');

  const handleTest = async () => {
    if (!backendUrl) {
      setTestResult('error');
      setTestMessage('请输入后端URL');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setTestMessage('');

    try {
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setTestResult('success');
        setTestMessage('连接成功！后端服务运行正常。');
      } else {
        setTestResult('error');
        setTestMessage(`连接失败：HTTP ${response.status}`);
      }
    } catch (error) {
      setTestResult('error');
      setTestMessage(`连接失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (backendUrl) {
      dataSyncService.setBackendUrl(backendUrl);
    } else {
      dataSyncService.setBackendUrl(null);
    }
    onOpenChange(false);
  };

  const handleClear = () => {
    setBackendUrl('');
    dataSyncService.setBackendUrl(null);
    setTestResult(null);
    setTestMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            数据同步设置
          </DialogTitle>
          <DialogDescription>
            配置后端服务器地址以实现多端数据同步。留空则仅使用本地存储。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="backend-url">后端服务器地址</Label>
            <Input
              id="backend-url"
              type="url"
              placeholder="http://localhost:8000"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              输入后端API服务器的完整URL地址
            </p>
          </div>

          {testResult && (
            <Alert variant={testResult === 'success' ? 'default' : 'destructive'}>
              <AlertDescription className="flex items-center gap-2">
                {testResult === 'success' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {testMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              同步说明
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 配置后端后，数据将自动同步到服务器</li>
              <li>• 所有连接的客户端将实时看到数据更新</li>
              <li>• 即使不配置后端，同一浏览器的多个标签页也会自动同步</li>
              <li>• 后端服务需要支持 /api/services 和 /api/categories 接口</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={!backendUrl}
          >
            清除配置
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleTest}
            disabled={!backendUrl || testing}
          >
            {testing ? '测试中...' : '测试连接'}
          </Button>
          <Button type="button" onClick={handleSave}>
            保存设置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}