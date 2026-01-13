import { AIProvider } from '../store/settings'

export interface AIEditRequest {
    instruction: string
    selectedText?: string
    context?: string
}

export async function callAI(
    provider: AIProvider,
    request: AIEditRequest
): Promise<string> {
    const messages = [
        {
            role: 'system',
            content: '你是一个专业的文本编辑助手。根据用户的指令编辑文本，直接返回编辑后的结果，不要添加任何解释。',
        },
    ]

    let userMessage = `指令：${request.instruction}`
    if (request.selectedText) {
        userMessage += `\n\n需要编辑的文本：\n${request.selectedText}`
    }
    if (request.context) {
        userMessage += `\n\n上下文：\n${request.context}`
    }

    messages.push({ role: 'user', content: userMessage })

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
            model: provider.model,
            messages,
            temperature: 0.7,
            max_tokens: 2000,
        }),
    })

    if (!response.ok) {
        throw new Error(`API 请求失败: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
}