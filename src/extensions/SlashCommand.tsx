import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import tippy from 'tippy.js'
import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react'

interface CommandItem {
    title: string
    description: string
    icon: string
    command: ({ editor, range }: any) => void
}

const CommandsList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

    const commands: CommandItem[] = [
        {
            title: '标题 1',
            description: '大标题',
            icon: 'H1',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
            },
        },
        {
            title: '标题 2',
            description: '中标题',
            icon: 'H2',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
            },
        },
        {
            title: '标题 3',
            description: '小标题',
            icon: 'H3',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
            },
        },
        {
            title: '无序列表',
            description: '创建无序列表',
            icon: '•',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run()
            },
        },
        {
            title: '有序列表',
            description: '创建有序列表',
            icon: '1.',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run()
            },
        },
        {
            title: '引用',
            description: '插入引用块',
            icon: '"',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run()
            },
        },
        {
            title: '代码块',
            description: '插入代码块',
            icon: '</>',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
            },
        },
        {
            title: '分隔线',
            description: '插入水平分隔线',
            icon: '—',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run()
            },
        },
        {
            title: 'AI 编辑',
            description: '使用 AI 编辑文本',
            icon: '✨',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run()
                // 触发 AI 编辑
                const event = new CustomEvent('openAIEdit')
                window.dispatchEvent(event)
            },
        },
    ]

    const selectItem = (index: number) => {
        const item = commands[index]
        if (item) {
            item.command(props)
        }
    }

    const upHandler = () => {
        setSelectedIndex((selectedIndex + commands.length - 1) % commands.length)
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % commands.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    useEffect(() => setSelectedIndex(0), [props.items])

    // 自动滚动到选中项
    useEffect(() => {
        const selectedElement = itemRefs.current[selectedIndex]
        if (selectedElement && containerRef.current) {
            selectedElement.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
            })
        }
    }, [selectedIndex])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: any) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }

            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }

            if (event.key === 'Enter') {
                enterHandler()
                return true
            }

            return false
        },
    }))

    return (
        <div
            ref={containerRef}
            className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl border border-gray-200/80 py-1.5 px-1 min-w-[240px] max-h-[320px] overflow-y-auto"
        >
            {commands.map((item, index) => (
                <button
                    key={index}
                    ref={(el) => {
                        itemRefs.current[index] = el
                    }}
                    onClick={() => selectItem(index)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors ${index === selectedIndex
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                        }`}
                >
                    <span className={`text-sm font-medium w-6 text-center ${index === selectedIndex ? 'text-white' : 'text-gray-500'
                        }`}>
                        {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium ${index === selectedIndex ? 'text-white' : 'text-gray-800'
                            }`}>
                            {item.title}
                        </div>
                        <div className={`text-[10px] ${index === selectedIndex ? 'text-white/80' : 'text-gray-500'
                            }`}>
                            {item.description}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    )
})

CommandsList.displayName = 'CommandsList'

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range })
                },
            },
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
                render: () => {
                    let component: ReactRenderer
                    let popup: any

                    return {
                        onStart: (props: any) => {
                            component = new ReactRenderer(CommandsList, {
                                props,
                                editor: props.editor,
                            })

                            if (!props.clientRect) {
                                return
                            }

                            popup = tippy('body', {
                                getReferenceClientRect: props.clientRect,
                                appendTo: () => document.body,
                                content: component.element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: 'manual',
                                placement: 'bottom-start',
                            })
                        },

                        onUpdate(props: any) {
                            component.updateProps(props)

                            if (!props.clientRect) {
                                return
                            }

                            popup[0].setProps({
                                getReferenceClientRect: props.clientRect,
                            })
                        },

                        onKeyDown(props: any) {
                            if (props.event.key === 'Escape') {
                                popup[0].hide()
                                return true
                            }

                            // @ts-ignore
                            return component.ref?.onKeyDown(props)
                        },

                        onExit() {
                            popup[0].destroy()
                            component.destroy()
                        },
                    }
                },
            }),
        ]
    },
})
