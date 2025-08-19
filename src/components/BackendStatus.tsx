import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const backendUrl = localStorage.getItem('service-nav-backend-config');
        const url = backendUrl ? JSON.parse(backendUrl).url : 'http://localhost:8001';
        
        const response = await fetch(`${url}/api/health`);
        if (response.ok) {
          setStatus('connected');
          setError('');
        } else {
          setStatus('disconnected');
          setError(`后端返回错误: ${response.status}`);
        }
      } catch (error) {
        setStatus('disconnected');
        setError(error instanceof Error ? error.message : '无法连接到后端服务');
      }
    };

    // 初始检查
    checkBackendStatus();

    // 每10秒检查一次
    const interval = setInterval(checkBackendStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return (
      <Alert className="mb-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>正在连接后端服务...</AlertDescription>
      </Alert>
    );
  }

  if (status === 'disconnected') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>后端服务未连接</strong>
          <br />
          {error}
          <br />
          请运行: <code className="bg-red-100 px-1 py-0.5 rounded">./start-backend.sh</code>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        后端服务已连接 (http://localhost:8001)
      </AlertDescription>
    </Alert>
  );
}