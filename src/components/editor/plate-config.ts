import {
    createPlateEditor,
    PlatePlugin,
    createPlugins,
} from '@platejs/core'
import {
    createParagraphPlugin,
    createHeadingPlugin,
    createBlockquotePlugin,
    createCodeBlockPlugin,
    createHorizontalRulePlugin,
} from '@platejs/basic-nodes'
import {
    createBoldPlugin,
    createItalicPlugin,
    createUnderlinePlugin,
    createStrikethroughPlugin,
    createCodePlugin,
} from '@platejs/basic-styles'
import {
    createListPlugin,
    createTodoListPlugin,
} from '@platejs/list'
import {
    createLinkPlugin,
} from '@platejs/link'
import {
    createTablePlugin,
} from '@platejs/table'
import {
    createAutoformatPlugin,
} from '@platejs/autoformat'
import {
    createFloatingPlugin,
} from '@platejs/floating'
import {
    createSelectionPlugin,
} from '@platejs/selection'
import {
    createDndPlugin,
} from '@platejs/dnd'

export const plugins = createPlugins([
    // Basic nodes
    createParagraphPlugin(),
    createHeadingPlugin(),
    createBlockquotePlugin(),
    createCodeBlockPlugin(),
    createHorizontalRulePlugin(),

    // Basic marks
    createBoldPlugin(),
    createItalicPlugin(),
    createUnderlinePlugin(),
    createStrikethroughPlugin(),
    createCodePlugin(),

    // Lists
    createListPlugin(),
    createTodoListPlugin(),

    // Links
    createLinkPlugin({
        options: {
            allowedSchemes: ['http', 'https', 'mailto', 'tel'],
        },
    }),

    // Tables
    createTablePlugin(),

    // Features
    createAutoformatPlugin({
        options: {
            rules: [
                // Headings
                {
                    mode: 'block',
                    type: 'h1',
                    match: '# ',
                },
                {
                    mode: 'block',
                    type: 'h2',
                    match: '## ',
                },
                {
                    mode: 'block',
                    type: 'h3',
                    match: '### ',
                },
                // Lists
                {
                    mode: 'block',
                    type: 'ul',
                    match: ['* ', '- '],
                },
                {
                    mode: 'block',
                    type: 'ol',
                    match: '1. ',
                },
                // Blockquote
                {
                    mode: 'block',
                    type: 'blockquote',
                    match: '> ',
                },
                // Code block
                {
                    mode: 'block',
                    type: 'code_block',
                    match: '```',
                },
                // Horizontal rule
                {
                    mode: 'block',
                    type: 'hr',
                    match: '---',
                },
                // Bold
                {
                    mode: 'mark',
                    type: 'bold',
                    match: '**',
                },
                // Italic
                {
                    mode: 'mark',
                    type: 'italic',
                    match: '*',
                },
                // Code
                {
                    mode: 'mark',
                    type: 'code',
                    match: '`',
                },
            ],
        },
    }),

    // Selection and floating
    createSelectionPlugin(),
    createFloatingPlugin(),

    // Drag and drop
    createDndPlugin(),
], {
    components: {
        // We'll define components later
    },
})

export const initialValue = [
    {
        type: 'p',
        children: [{ text: '开始编写你的文档...' }],
    },
]

export function createEditor() {
    return createPlateEditor({
        plugins,
        value: initialValue,
    })
}