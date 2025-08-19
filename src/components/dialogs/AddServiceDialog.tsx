import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import type { Category, Service } from '@/types';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSubmit: (service: Omit<Service, 'id'>) => void;
  editingService?: Service | null;
}

export function AddServiceDialog({
  open,
  onOpenChange,
  categories,
  onSubmit,
  editingService,
}: AddServiceDialogProps) {
  const [formData, setFormData] = useState<Omit<Service, 'id'>>({
    name: editingService?.name || '',
    url: editingService?.url || '',
    description: editingService?.description || '',
    category: editingService?.category || categories[0]?.id || '',
    status: editingService?.status || 'online',
    tags: editingService?.tags || [],
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (editingService) {
      setFormData({
        name: editingService.name,
        url: editingService.url,
        description: editingService.description || '',
        category: editingService.category,
        status: editingService.status || 'online',
        tags: editingService.tags || [],
      });
    } else {
      setFormData({
        name: '',
        url: '',
        description: '',
        category: categories[0]?.id || '',
        status: 'online',
        tags: [],
      });
    }
    setErrors({});
  }, [editingService, categories, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '服务名称是必填项';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL是必填项';
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = '请输入有效的URL';
    }

    if (!formData.category) {
      newErrors.category = '分类是必填项';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      // Allow URLs without protocol (will add http:// by default)
      if (!url.match(/^https?:\/\//)) {
        url = 'http://' + url;
      }
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const formatUrl = (url: string) => {
    if (!url.match(/^https?:\/\//)) {
      return 'http://' + url;
    }
    return url;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        url: formatUrl(formData.url),
        lastUpdated: new Date(),
      });
      onOpenChange(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove) || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingService ? '编辑服务' : '添加新服务'}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? '更新以下服务信息。'
                : '添加新服务到您的导航面板。'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">服务名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：生产环API"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="url">服务地址</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="例如：192.168.1.100:8080 或 https://api.example.com"
              />
              {errors.url && (
                <p className="text-sm text-destructive">{errors.url}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">分类</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">描述（可选）</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="简要描述该服务..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">状态</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Service['status'] })}
              >
                <option value="online">在线</option>
                <option value="offline">离线</option>
                <option value="maintenance">维护中</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">标签（可选）</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="添加标签..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} variant="secondary">
                  添加
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">
              {editingService ? '更新服务' : '添加服务'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}