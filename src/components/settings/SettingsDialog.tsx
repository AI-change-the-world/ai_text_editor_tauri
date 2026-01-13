import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { useSettingsStore } from '../../store/settings'
import { AIProvider } from '../../types'
import {
    Settings,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Check,
} from 'lucide-react'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '../ui/Tabs'
import { Switch } from '../ui/Switch'

interface SettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const {
        theme,
        aiProviders,
        defaultProvider,
        autoSave,
        autoSaveInterval,
        updateSettings,
        addAIProvider,
        updateAIProvider,
        removeAIProvider,
        setDefaultProvider,
    } = useSettingsStore()

    const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
    const [newProvider, setNewProvider] = useState<Partial<AIProvider>>({
        name: '',
        apiKey: '',
        baseUrl: '',
        model: '',
        enabled: true,
    })

    const toggleApiKeyVisibility = (providerId: string) => {
        setShowApiKeys(prev => ({
            ...prev,
            [providerId]: !prev[providerId],
        }))
    }

    const handleAddProvider = () => {
        if (newProvider.name && newProvider.apiKey && newProvider.model) {
            addAIProvider(newProvider as Omit<AIProvider, 'id'>)
            setNewProvider({
                name: '',
                apiKey: '',
                baseUrl: '',
                model: '',
                enabled: true,
            })
        }
    }

    const handleUpdateProvider = (id: string, updates: Partial<AIProvider>) => {
        updateAIProvider(id, updates)
    }

    const handleRemoveProvider = (id: string) => {
        if (confirm('确定要删除这个 AI 提供商吗？')) {
            removeAIProvider(id)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        设置
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="ai" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="ai">AI 配置</TabsTrigger>
                        <TabsTrigger value="general">通用设置</TabsTrigger>
                        <TabsTrigger value="about">关于</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ai" className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-4">AI 提供商</h3>

                            {/* Existing Providers */}
                            <div className="space-y-4 mb-6">
                                {aiProviders.map((provider) => (
                                    <div key={provider.id} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-medium">{provider.name}</h4>
                                                <Switch
                                                    checked={provider.enabled}
                                                    onCheckedChange={(enabled) =>
                                                        handleUpdateProvider(provider.id, { enabled })
                                                    }
                                                />
                                                {defaultProvider === provider.id && (
                                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                                        默认
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {provider.enabled && provider.apiKey && (
                                                    <Button
                                                        size="sm"
                                                        variant={defaultProvider === provider.id ? "default" : "outline"}
                                                        onClick={() => setDefaultProvider(provider.id)}
                                                    >
                                                        {defaultProvider === provider.id ? (
                                                            <Check className="h-4 w-4 mr-1" />
                                                        ) : null}
                                                        设为默认
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRemoveProvider(provider.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium">API Key</label>
                                                <div className="relative mt-1">
                                                    <Input
                                                        type={showApiKeys[provider.id] ? "text" : "password"}
                                                        value={provider.apiKey}
                                                        onChange={(e) =>
                                                            handleUpdateProvider(provider.id, { apiKey: e.target.value })
                                                        }
                                                        placeholder="输入 API Key"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3"
                                                        onClick={() => toggleApiKeyVisibility(provider.id)}
                                                    >
                                                        {showApiKeys[provider.id] ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium">模型</label>
                                                <Input
                                                    value={provider.model}
                                                    onChange={(e) =>
                                                        handleUpdateProvider(provider.id, { model: e.target.value })
                                                    }
                                                    placeholder="例如: gpt-3.5-turbo"
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <label className="text-sm font-medium">Base URL (可选)</label>
                                                <Input
                                                    value={provider.baseUrl || ''}
                                                    onChange={(e) =>
                                                        handleUpdateProvider(provider.id, { baseUrl: e.target.value })
                                                    }
                                                    placeholder="例如: https://api.openai.com/v1"
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add New Provider */}
                            <div className="border rounded-lg p-4 bg-muted/30">
                                <h4 className="font-medium mb-3">添加新的 AI 提供商</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">名称</label>
                                        <Input
                                            value={newProvider.name || ''}
                                            onChange={(e) =>
                                                setNewProvider(prev => ({ ...prev, name: e.target.value }))
                                            }
                                            placeholder="例如: OpenAI"
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">模型</label>
                                        <Input
                                            value={newProvider.model || ''}
                                            onChange={(e) =>
                                                setNewProvider(prev => ({ ...prev, model: e.target.value }))
                                            }
                                            placeholder="例如: gpt-3.5-turbo"
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">API Key</label>
                                        <Input
                                            type="password"
                                            value={newProvider.apiKey || ''}
                                            onChange={(e) =>
                                                setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))
                                            }
                                            placeholder="输入 API Key"
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">Base URL (可选)</label>
                                        <Input
                                            value={newProvider.baseUrl || ''}
                                            onChange={(e) =>
                                                setNewProvider(prev => ({ ...prev, baseUrl: e.target.value }))
                                            }
                                            placeholder="例如: https://api.openai.com/v1"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleAddProvider}
                                    className="mt-4"
                                    disabled={!newProvider.name || !newProvider.apiKey || !newProvider.model}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    添加提供商
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="general" className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-4">通用设置</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium">主题</label>
                                        <p className="text-sm text-muted-foreground">选择应用主题</p>
                                    </div>
                                    <select
                                        value={theme}
                                        onChange={(e) => updateSettings({ theme: e.target.value as any })}
                                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="light">浅色</option>
                                        <option value="dark">深色</option>
                                        <option value="system">跟随系统</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium">自动保存</label>
                                        <p className="text-sm text-muted-foreground">自动保存文档更改</p>
                                    </div>
                                    <Switch
                                        checked={autoSave}
                                        onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
                                    />
                                </div>

                                {autoSave && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-sm font-medium">自动保存间隔</label>
                                            <p className="text-sm text-muted-foreground">自动保存的时间间隔（秒）</p>
                                        </div>
                                        <Input
                                            type="number"
                                            value={autoSaveInterval}
                                            onChange={(e) => updateSettings({ autoSaveInterval: parseInt(e.target.value) || 30 })}
                                            className="w-20"
                                            min="5"
                                            max="300"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="about" className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-4">关于</h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium">AI 文本编辑器</h4>
                                    <p className="text-sm text-muted-foreground">
                                        基于 Plate.js 和 Tauri 构建的智能文本编辑器
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-medium">版本</h4>
                                    <p className="text-sm text-muted-foreground">v0.1.0</p>
                                </div>

                                <div>
                                    <h4 className="font-medium">功能特性</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• 富文本编辑器，支持 Markdown 语法</li>
                                        <li>• AI 辅助编辑和文本生成</li>
                                        <li>• 文档管理和搜索</li>
                                        <li>• 多种 AI 提供商支持</li>
                                        <li>• 自动保存功能</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}