import React from 'react'

interface SimpleEditorProps {
    value?: any[]
    onChange?: (value: any[]) => void
    placeholder?: string
    readOnly?: boolean
}

export function SimpleEditor({
    value,
    onChange,
    placeholder = '开始编写...',
    readOnly = false,
}: SimpleEditorProps) {
    const [content, setContent] = React.useState('')

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value
        setContent(newContent)

        // Convert to Plate format for compatibility
        const plateValue = [
            {
                type: 'p',
                children: [{ text: newContent }],
            },
        ]

        onChange?.(plateValue)
    }

    return (
        <div className="w-full">
            <textarea
                value={content}
                onChange={handleChange}
                placeholder={placeholder}
                readOnly={readOnly}
                className="w-full min-h-[500px] p-4 border border-input rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
        </div>
    )
}