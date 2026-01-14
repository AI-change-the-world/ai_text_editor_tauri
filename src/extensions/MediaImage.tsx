import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { convertFileSrc } from '@tauri-apps/api/core'
import { useState, useEffect } from 'react'
import { mediaAPI, parseMediaUrl, isMediaUrl } from '../services/database'

// 图片节点视图组件
function ImageNodeView({ node, updateAttributes }: any) {
    const [src, setSrc] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const { mediaSrc, alt, width, height } = node.attrs

    useEffect(() => {
        const loadImage = async () => {
            if (!mediaSrc) {
                setLoading(false)
                return
            }

            // 检查是否是媒体引用
            if (isMediaUrl(mediaSrc)) {
                const mediaId = parseMediaUrl(mediaSrc)
                if (mediaId) {
                    try {
                        const path = await mediaAPI.getPath(mediaId)
                        // 使用 Tauri 的 convertFileSrc 转换本地路径
                        setSrc(convertFileSrc(path))
                    } catch (e) {
                        console.error('Failed to load media:', e)
                        setError(true)
                    }
                }
            } else {
                // 普通 URL
                setSrc(mediaSrc)
            }
            setLoading(false)
        }

        loadImage()
    }, [mediaSrc])

    if (loading) {
        return (
            <NodeViewWrapper className="inline-block">
                <div className="w-32 h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                    加载中...
                </div>
            </NodeViewWrapper>
        )
    }

    if (error || !src) {
        return (
            <NodeViewWrapper className="inline-block">
                <div className="w-32 h-24 bg-red-50 border border-red-200 rounded flex items-center justify-center text-red-400 text-xs">
                    图片加载失败
                </div>
            </NodeViewWrapper>
        )
    }

    return (
        <NodeViewWrapper className="inline-block">
            <img
                src={src}
                alt={alt || ''}
                style={{
                    width: width ? `${width}px` : 'auto',
                    height: height ? `${height}px` : 'auto',
                    maxWidth: '100%',
                }}
                className="rounded"
                draggable={false}
            />
        </NodeViewWrapper>
    )
}

// 自定义图片扩展
export const MediaImage = Node.create({
    name: 'mediaImage',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            mediaSrc: {
                default: null,
            },
            alt: {
                default: null,
            },
            width: {
                default: null,
            },
            height: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'img[data-media-src]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(HTMLAttributes, { 'data-media-src': HTMLAttributes.mediaSrc })]
    },

    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView)
    },

    addCommands() {
        return {
            setMediaImage:
                (options: { mediaSrc: string; alt?: string; width?: number; height?: number }) =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: options,
                        })
                    },
        }
    },
})

// 图片上传处理函数
export async function handleImageUpload(
    file: File,
    workspaceId: string,
    fileId: string
): Promise<{ mediaSrc: string; width?: number; height?: number }> {
    // 上传到后端
    const asset = await mediaAPI.upload(workspaceId, fileId, file, file.name)

    return {
        mediaSrc: `media://${asset.id}`,
        width: asset.width,
        height: asset.height,
    }
}
