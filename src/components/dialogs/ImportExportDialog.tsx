import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { Service, Category } from '@/types';
import { importExportService } from '@/services/importExport';
import type { ExportData } from '@/services/importExport';
import { Download, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  categories: Category[];
  onImport: (services: Service[], categories: Category[]) => void;
}

export function ImportExportDialog({
  open,
  onOpenChange,
  services,
  categories,
  onImport,
}: ImportExportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStrategy, setImportStrategy] = useState<'replace' | 'merge' | 'append'>('replace');
  const [importResult, setImportResult] = useState<{
    success?: boolean;
    message?: string;
    errors?: string[];
  }>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<ExportData | null>(null);

  const handleExport = () => {
    importExportService.downloadConfig(services, categories);
    setImportResult({
      success: true,
      message: '配置导出成功！',
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult({});
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const result = await importExportService.importFromFile(file);
    
    if (result.success && result.data) {
      setImportedData(result.data);
      setImportResult({
        success: true,
        message: `文件验证成功：${result.data.services.length} 个服务，${result.data.categories.length} 个分类`,
      });
    } else {
      setImportResult({
        success: false,
        errors: result.errors,
      });
      setImportedData(null);
    }
  };

  const handleImportConfirm = () => {
    if (!importedData) return;

    const { services: mergedServices, categories: mergedCategories } = 
      importExportService.mergeData(
        services,
        categories,
        importedData.services,
        importedData.categories,
        importStrategy
      );

    onImport(mergedServices, mergedCategories);
    setImportResult({
      success: true,
      message: '配置导入成功！',
    });
    
    // Reset state after successful import
    setTimeout(() => {
      onOpenChange(false);
      setSelectedFile(null);
      setImportedData(null);
      setImportResult({});
    }, 1500);
  };

  const handleGenerateSample = () => {
    const sampleData = importExportService.generateSampleConfig();
    const jsonString = JSON.stringify(sampleData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    setImportResult({
      success: true,
      message: '示例配置已下载！',
    });
  };

  const strategyDescriptions = {
    replace: '删除所有现有数据并替换为导入的数据',
    merge: '合并导入的数据和现有数据（更新相同ID的项目）',
    append: '将导入的数据作为新项目添加（生成新的ID）',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>导入 / 导出配置</DialogTitle>
          <DialogDescription>
            管理您的服务导航配置
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="mr-2 h-4 w-4" />
              导出
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="mr-2 h-4 w-4" />
              导入
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">当前配置</h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">服务</p>
                  <p className="text-2xl font-bold">{services.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">分类</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                导出您当前的配置为JSON文件，可以稍后导入或与他人共享。
              </p>
            </div>

            {importResult.success && importResult.message && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{importResult.message}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleGenerateSample}>
                <FileJson className="mr-2 h-4 w-4" />
                下载示例
              </Button>
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                导出配置
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">选择配置文件</Label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {selectedFile ? selectedFile.name : '选择文件'}
                  </Button>
                </div>
              </div>

              {importedData && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-2">文件内容</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">服务</p>
                        <p className="text-lg font-semibold">{importedData.services.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">分类</p>
                        <p className="text-lg font-semibold">{importedData.categories.length}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      导出时间：{new Date(importedData.exportDate).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>导入策略</Label>
                    <RadioGroup value={importStrategy} onValueChange={(value: any) => setImportStrategy(value)}>
                      {Object.entries(strategyDescriptions).map(([value, description]) => (
                        <div key={value} className="flex items-start space-x-2">
                          <RadioGroupItem value={value} id={value} className="mt-1" />
                          <div className="space-y-1">
                            <Label htmlFor={value} className="font-medium cursor-pointer">
                              {value === 'replace' ? '替换' : value === 'merge' ? '合并' : '追加'}
                            </Label>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              )}

              {importResult.errors && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">导入失败：</p>
                      <ul className="list-disc list-inside text-sm">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {importResult.success && importResult.message && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{importResult.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button 
                onClick={handleImportConfirm} 
                disabled={!importedData || !!importResult.errors}
              >
                导入配置
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}