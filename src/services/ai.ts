import { AIProvider, AIEditRequest, AIEditResponse } from '../types'

export class AIService {
    private provider: AIProvider

    constructor(provider: AIProvider) {
        this.provider = provider
    }

    async editText(request: AIEditRequest): Promise<AIEditResponse> {
        if (!this.provider.enabled || !this.provider.apiKey) {
            throw new Error('AI provider not configured')
        }

        try {
            const response = await this.makeRequest({
                instruction: request.instruction,
                selectedText: request.selectedText,
                context: request.context,
            })

            return {
                editedText: response.editedText,
                explanation: response.explanation,
            }
        } catch (error) {
            console.error('AI edit request failed:', error)
            throw new Error('AI 编辑请求失败')
        }
    }

    async generateText(prompt: string): Promise<string> {
        if (!this.provider.enabled || !this.provider.apiKey) {
            throw new Error('AI provider not configured')
        }

        try {
            const response = await this.makeRequest({
                instruction: prompt,
            })

            return response.editedText
        } catch (error) {
            console.error('AI generation request failed:', error)
            throw new Error('AI 生成请求失败')
        }
    }

    private async makeRequest(request: any): Promise<any> {
        // OpenAI API format
        if (this.provider.id === 'openai' || this.provider.baseUrl?.includes('openai')) {
            return this.makeOpenAIRequest(request)
        }

        // Claude API format
        if (this.provider.id === 'claude' || this.provider.baseUrl?.includes('anthropic')) {
            return this.makeClaudeRequest(request)
        }

        // Generic OpenAI-compatible API
        return this.makeOpenAIRequest(request)
    }

    private async makeOpenAIRequest(request: any): Promise<any> {
        const messages = [
            {
                role: 'system',
                content: '你是一个专业的文本编辑助手。根据用户的指令编辑文本，保持原有的格式和风格。如果用户选择了特定文本，请重点编辑选中的部分。',
            },
        ]

        if (request.context) {
            messages.push({
                role: 'user',
                content: `上下文：${request.context}`,
            })
        }

        let userMessage = `指令：${request.instruction}`
        if (request.selectedText) {
            userMessage += `\n\n选中的文本：${request.selectedText}`
        }

        messages.push({
            role: 'user',
            content: userMessage,
        })

        const response = await fetch(`${this.provider.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.provider.apiKey}`,
            },
            body: JSON.stringify({
                model: this.provider.model,
                messages,
                temperature: 0.7,
                max_tokens: 2000,
            }),
        })

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`)
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content || ''

        return {
            editedText: content,
            explanation: '已完成编辑',
        }
    }

    private async makeClaudeRequest(request: any): Promise<any> {
        let prompt = `你是一个专业的文本编辑助手。根据用户的指令编辑文本，保持原有的格式和风格。

指令：${request.instruction}`

        if (request.context) {
            prompt += `\n\n上下文：${request.context}`
        }

        if (request.selectedText) {
            prompt += `\n\n选中的文本：${request.selectedText}`
        }

        prompt += '\n\n请直接返回编辑后的文本：'

        const response = await fetch(`${this.provider.baseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.provider.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.provider.model,
                max_tokens: 2000,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        })

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`)
        }

        const data = await response.json()
        const content = data.content[0]?.text || ''

        return {
            editedText: content,
            explanation: '已完成编辑',
        }
    }
}

export function createAIService(provider: AIProvider): AIService {
    return new AIService(provider)
}