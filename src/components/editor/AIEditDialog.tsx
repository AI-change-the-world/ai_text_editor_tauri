import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { useSettingsStore } from '../../store/settings'
import { createAIService } from '../../services/ai'
import { Loader2, Sparkles } from 'lucide-react'

interface AIEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedText?: string
    onEdit: (editedText: string) => void
}

export function AIEditDialog({
    open,
    onOpenChange,
    selectedText,
    onEdit,
}: AIEditDialogProps) {
    const [instruction, setInstruction] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState('')
    const { aiProviders, defaultProvider } = useSettingsStore()

    const activeProvider = aiProviders.find(
        p => p.enabled && p.apiKey && (p.id === defaultProvider || !defaultProvider)
    )

    const handleSubmit = async () => {
        if (!instruction.trim() || !activeProvider) return

        setIsLoading(true)
        setResult('')

        try {
            const aiService = createAIService(activeProvider)
            const response = await aiService.editText({
                instruction: instruction.trim(),
                selectedText,
            })

            setResult(response.editedText)
        } catch (error) {
            console.error('AI edit failed:', error)
            setResult('AI 编辑失败，请检查配置或稍后重试。')
        } finally {
            setIsLoading(false)
        }
    }

    const handleApply = () => {
        if (result) {
            onEdit(result)
            setInstruction('')
            setResult('')
        }
    }

    const handleClose = () => {
        onOpenChange(false)
        setInstruction('')
        setResult('')
    }

    const quickPrompts = [
        '修正语法错误',
        '改写得更简洁',
        '改写得更正式',
        '翻译成英文',
        '总结要点',
        '扩展内容',
    ]

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        AI 编辑助手
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {selectedText && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                选中的文本：
                            </label>
                            <div className="mt-1 p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">
                                {selectedText}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium">
                            编辑指令：
                        </label>
                        <Textarea
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="请输入你想要的编辑指令，例如：修正语法错误、改写得更简洁、翻译成英文等..."
                            className="mt-1"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            快速指令：
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {quickPrompts.map((prompt) => (
                                <Button
                                    key={prompt}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setInstruction(prompt)}
                                    className="text-xs"
                                >
                                    {prompt}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {result && (
                        <div>
                            <label className="text-sm font-medium">
                                AI 编辑结果：
                            </label>
                            <div className="mt-1 p-3 bg-muted rounded-md text-sm max-h-48 overflow-y-auto whitespace-pre-wrap">
                                {result}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            取消
                        </Button>

                        {!result ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={!instruction.trim() || isLoading || !activeProvider}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        处理中...
                                    </>
                                ) : (
                                    '开始编辑'
                                )}
                            </Button>
                        ) : (
                            <Button onClick={handleApply}>
                                应用编辑
                            </Button>
                        )}
                    </div>

                    {!activeProvider && (
                        <p className="text-sm text-muted-foreground text-center">
                            请先在设置中配置 AI 提供商
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}