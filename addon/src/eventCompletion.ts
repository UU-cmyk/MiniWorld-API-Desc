import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

const EVENT_DEFINITIONS_FILE = path.join('addon', 'types', '2.0', 'MNEvent.d.json');

export type EventDefinition = {
    desc?: string;
    event_info?: Record<string, string>;
};

// 事件补全数据异步加载状态
let eventDefinitionsReady = false;
let eventDefinitions: Map<string, EventDefinition> = new Map();

function getEventDefinitionsFile(context: vscode.ExtensionContext): string {
    return context.asAbsolutePath(EVENT_DEFINITIONS_FILE);
}

export async function parseEventDefinitions(filePath: string): Promise<Map<string, EventDefinition>> {
    try {
        const raw = await fs.promises.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw) as Record<string, EventDefinition>;

        return new Map(Object.entries(parsed).sort(([left], [right]) => left.localeCompare(right)));
    } catch (error) {
        console.warn(`读取事件补全文件失败: ${filePath}`, error);
        return new Map();
    }
}

export function buildEventCompletionItems(definitions: Map<string, EventDefinition>): vscode.CompletionItem[] {
    return Array.from(definitions.entries()).map(([eventName, definition]) => {
        const item = new vscode.CompletionItem(eventName, vscode.CompletionItemKind.Event);
        item.detail = definition.desc ?? 'MiniWorld 事件';
        item.filterText = eventName;
        item.insertText = eventName;
        item.command = {
            command: 'complete.wrapEventBrackets',
            title: '补全事件长括号',
            arguments: [eventName]
        };

        const infoLines = definition.event_info
            ? Object.entries(definition.event_info).map(([key, value]) => `- ${key}: ${value}`)
            : [];

        const documentation = [
            definition.desc ? `**${definition.desc}**` : '',
            infoLines.length > 0 ? `参数:\n${infoLines.join('\n')}` : '',
        ].filter(Boolean).join('\n\n');

        item.documentation = new vscode.MarkdownString(documentation);

        return item;
    });
}

/**
 * 获取光标前的 Lua 长括号字符串 `[=[...]=]` 内已输入的事件名前缀。
 * 若不在 `[=[` 上下文中，则返回 `null`，表示不应显示事件补全。
 */
function getEventPrefix(document: vscode.TextDocument, position: vscode.Position): string | null {
    const textBeforeCursor = document.lineAt(position.line).text.substring(0, position.character);

    // 查找最后一个 [=[ 长括号起始
    const lastLongBracket = textBeforeCursor.lastIndexOf('[=[');
    if (lastLongBracket !== -1) {
        return textBeforeCursor.substring(lastLongBracket + 3);
    }

    return null;
}

/**
 * 注册事件补全提供者和括号包裹命令。
 * @returns 需要添加到 context.subscriptions 的 Disposable 数组
 */
export function registerEventCompletion(context: vscode.ExtensionContext): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];

    const eventDefinitionsFile = getEventDefinitionsFile(context);

    // 异步加载事件定义，不阻塞激活
    parseEventDefinitions(eventDefinitionsFile).then(defs => {
        eventDefinitions = defs;
        eventDefinitionsReady = true;
    });

    // 注册补全提供者
    disposables.push(
        vscode.languages.registerCompletionItemProvider(
            { language: 'lua' },
            {
                provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                    const prefix = getEventPrefix(document, position);
                    // 仅在 [=[ 上下文中提供事件补全
                    if (prefix === null) {
                        return [];
                    }
                    // 数据未就绪则暂不补全
                    if (!eventDefinitionsReady) {
                        return [];
                    }
                    const items = buildEventCompletionItems(eventDefinitions);

                    return items.filter((item) => item.label.toString().toLowerCase().startsWith(prefix.toLowerCase()));
                },
            },
            '.'
        )
    );

    // 注册长括号包裹命令
    disposables.push(
        vscode.commands.registerCommand('complete.wrapEventBrackets', (eventName: string) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || !eventName) { return; }

            const document = editor.document;
            const cursorPos = editor.selection.active;
            const eventStartPos = new vscode.Position(cursorPos.line, cursorPos.character - eventName.length);

            if (eventStartPos.character < 0) { return; }

            const lineText = document.lineAt(cursorPos.line).text;
            const textBeforeEvent = lineText.substring(0, eventStartPos.character);
            const textAfterEvent = lineText.substring(cursorPos.character);

            const hasLeftBracket = textBeforeEvent.endsWith('[=[');
            const hasRightBracket = textAfterEvent.startsWith(']=]');

            const edits: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();

            if (!hasLeftBracket) {
                edits.insert(document.uri, eventStartPos, '[=[');
            }
            if (!hasRightBracket) {
                edits.insert(document.uri, cursorPos, ']=]');
            }

            if (edits.size > 0) {
                vscode.workspace.applyEdit(edits);
            }
        })
    );

    return disposables;
}
