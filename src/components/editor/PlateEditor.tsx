import React, { useCallback, useEffect, useMemo } from 'react'
import {
    Plate,
    PlateContent,
    useEditorRef,
    useEditorValue,
} from '@platejs/core'
import { plugins, initialValue } from './plate-config'
import { FloatingToolbar } from './FloatingToolbar'
import { useDocumentsStore } from '../../store/documents'

interface PlateEditorProps {
    value?: any[]
    onChange?: (value: any[]) => void
    placeholder?: string
    readOnly?: boolean
}

export function PlateEditor({
    value,
    onChange,
    placeholder = '开始编写...',
    readOnly = false,
}: PlateEditorProps) {
    const editor = useMemo(() => plugins, [])

    const handleChange = useCallback((newValue: any[]) => {
        onChange?.(newValue)
    }, [onChange])

    return (
        <div className="relative w-full">
            <Plate
                plugins={editor}
                value={value || initialValue}
                onChange={handleChange}
                readOnly={readOnly}
            >
                <div className="relative">
                    <PlateContent
                        className="slate-editor"
                        placeholder={placeholder}
                        spellCheck={false}
                    />
                    {!readOnly && <FloatingToolbar />}
                </div>
            </Plate>
        </div>
    )
}

// Hook for auto-saving
export function useAutoSave() {
    const { currentDocument, updateDocument } = useDocumentsStore()
    const editor = useEditorRef()
    const value = useEditorValue()

    useEffect(() => {
        if (!currentDocument) return

        const timeoutId = setTimeout(() => {
            updateDocument(currentDocument.id, {
                content: value,
            })
        }, 1000) // Auto-save after 1 second of inactivity

        return () => clearTimeout(timeoutId)
    }, [value, currentDocument, updateDocument])
}