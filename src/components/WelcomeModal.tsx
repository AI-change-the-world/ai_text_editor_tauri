import { useState, useEffect } from 'react'
import { type File } from '../services/database'

interface NewsItem {
    title: string
    url: string
}

interface WelcomeModalProps {
    recentFiles: File[]
    onOpenFile: (file: File) => void
    onClose: () => void
}

export function WelcomeModal({ recentFiles, onOpenFile, onClose }: WelcomeModalProps) {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loadingNews, setLoadingNews] = useState(true)
    const [currentTime, setCurrentTime] = useState(new Date())

    // 获取热点新闻
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch(
                    'https://newsnow.busiyi.world/api/s?id=weibo&latest',
                    {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            Accept: 'application/json, text/plain, */*',
                        },
                    }
                )
                const data = await response.json()
                if (data.status === 'success' || data.status === 'cache') {
                    const items = (data.items || [])
                        .slice(0, 8)
                        .map((item: any) => ({
                            title: item.title || '',
                            url: item.url || '',
                        }))
                        .filter((item: NewsItem) => item.title)
                    setNews(items)
                }
            } catch (e) {
                console.error('Failed to fetch news:', e)
            } finally {
                setLoadingNews(false)
            }
        }
        fetchNews()
    }, [])

    // 更新时间
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const greeting = () => {
        const hour = currentTime.getHours()
        if (hour < 6) return '夜深了'
        if (hour < 9) return '早上好'
        if (hour < 12) return '上午好'
        if (hour < 14) return '中午好'
        if (hour < 18) return '下午好'
        if (hour < 22) return '晚上好'
        return '夜深了'
    }

    const openUrl = (url: string) => {
        window.open(url, '_blank')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 背景遮罩 + 模糊 */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* 弹窗主体 */}
            <div className="relative w-[680px] max-h-[80vh] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-2xl animate-slideIn">
                {/* 装饰性光效 */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

                {/* 关闭按钮 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
                >
                    ✕
                </button>

                {/* 内容 */}
                <div className="relative p-8">
                    {/* 头部问候 */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/25">
                                ✨
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    {greeting()}，欢迎回来
                                </h1>
                                <p className="text-white/50 text-sm">
                                    {currentTime.toLocaleDateString('zh-CN', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                    {' · '}
                                    {currentTime.toLocaleTimeString('zh-CN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* 最近文件 */}
                        <div>
                            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                最近文档
                            </h2>
                            <div className="space-y-2">
                                {recentFiles.length === 0 ? (
                                    <div className="text-white/40 text-sm py-4 text-center">
                                        暂无最近文档
                                    </div>
                                ) : (
                                    recentFiles.slice(0, 5).map((file) => (
                                        <button
                                            key={file.id}
                                            onClick={() => {
                                                onOpenFile(file)
                                                onClose()
                                            }}
                                            className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">
                                                    📄
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-white text-sm font-medium truncate">
                                                        {file.title}
                                                    </div>
                                                    <div className="text-white/40 text-xs">
                                                        {new Date(file.updated_at).toLocaleDateString('zh-CN')}
                                                    </div>
                                                </div>
                                                <span className="text-white/30 group-hover:text-white/60 transition-colors">
                                                    →
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 热点新闻 */}
                        <div>
                            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                今日热点
                            </h2>
                            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                {loadingNews ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                                    </div>
                                ) : news.length === 0 ? (
                                    <div className="text-white/40 text-sm py-4 text-center">
                                        暂无热点
                                    </div>
                                ) : (
                                    news.map((item, index) => (
                                        <button
                                            key={index}
                                            onClick={() => openUrl(item.url)}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="flex items-start gap-2">
                                                <span
                                                    className={`flex-shrink-0 w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${index < 3
                                                        ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
                                                        : 'bg-white/10 text-white/50'
                                                        }`}
                                                >
                                                    {index + 1}
                                                </span>
                                                <span className="text-white/80 text-sm leading-tight group-hover:text-white transition-colors line-clamp-2">
                                                    {item.title}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 底部快捷操作 */}
                    <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-white/10 rounded text-white/50 text-xs">
                                Esc
                            </kbd>
                            <span className="text-white/40 text-xs">关闭</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
                        >
                            开始创作
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
