import React, { useState } from 'react'
import {
    useEditorRef,
    useEditorSelection,
    getSelectionText,
    insertText,
    replaceSelection,
} from '@platejs/core'
import {
    FloatingToolbar as PlateFloatingToolbar,
    useFloatingToolbar,
} from '@platejs/floating'
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Link,
    Sparkles,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { AIEditDialog } from './AIEditDialog'
import { useSettingsStore } from '../../store/settings'

export function FloatingToolbar() {
    const editor = useEditorRef()
    const selection = useEditorSelection()
    const [showAIDialog, setShowAIDialog] = useState(false)
    const { aiProviders, defaultProvider } = useSettingsStore()

    const { props: floatingProps } = useFloatingToolbar({
        editor,
    })

    if (!selection) return null

    const selectedText = getSelectionText(editor)
    const hasAIProvider = aiProviders.some(p => p.enabled && p.apiKey)

    const toggleMark = (mark: string) => {
        editor.tf.toggle.mark({ type: mark })
    }

    const handleAIEdit = (editedText: string) => {
        if (selectedText) {
            replaceSelection(editor, editedText)
        } else {
            insertText(editor, editedText)
        }
        setShowAIDialog(false)
    }

    return (
        <>
            <PlateFloatingToolbar {...floatingProps}>
                <div className="slate-floating-toolbar">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleMark('bold')}
                        data-state={editor.marks.bold ? 'on' : 'off'}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleMark('italic')}
                        data-state={editor.marks.italic ? 'on' : 'off'}
                    >
                        <Italic className="h-4 w-4" />
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleMark('underline')}
                        data-state={editor.marks.underline ? 'on' : 'off'}
                    >
                        <Underline className="h-4 w-4" />
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleMark('strikethrough')}
                        data-state={editor.marks.strikethrough ? 'on' : 'off'}
                    >
                        <Strikethrough className="h-4 w-4" />
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleMark('code')}
                        data-state={editor.marks.code ? 'on' : 'off'}
                    >
                        <Code className="h-4 w-4" />
                    </Button>

                    <div className="h-4 w-px bg-border mx-1" />

                    {hasAIProvider && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowAIDialog(true)}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            <Sparkles className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </PlateFloatingToolbar>

            <AIEditDialog
                open={showAIDialog}
                onOpenChange={setShowAIDialog}
                selectedText={selectedText}
                onEdit={handleAIEdit}
            />
        </>
    )
}