# MiniWorld API Description

![VS Code](https://img.shields.io/badge/VS%20Code-^1.125.0-blue)
![Lua](https://img.shields.io/badge/Lua-5.1%2B-yellow)

A VS Code extension providing Lua type declarations, API search, and event completion for *Mini World* (迷你世界) UGC development.

## Features

### 📦 Type Declarations

Provides complete Lua type declaration files for **UGC 3.0** & **UGC 2.0**, working with the [Lua Language Server (sumneko.lua)](https://marketplace.visualstudio.com/items?itemName=sumneko.lua) to deliver:

- Intelligent autocompletion
- Type hints and parameter documentation
- Inline function signatures

Press `Ctrl+Shift+P` and run one of the following commands to get started:

| Command | Description |
| :-: | :-: |
| `MiniWorld API Description: Add MiniWorld UGC 2.0 Declarations` | Add 2.0 declarations to `Lua.workspace.library` |
| `MiniWorld API Description: Add MiniWorld UGC 3.0 Declarations` | Add 3.0 declarations to `Lua.workspace.library` |

2.0 and 3.0 declarations are mutually exclusive — they cannot coexist.

### 🔍 API Search

Search all MiniWorld APIs directly from the VS Code sidebar — no need to leave your editor.

| Method | Action |
| :-: | :-: |
| **Command Palette** | `Ctrl+Shift+P` → **MiniWorld API Description: Open API Search** |
| **Sidebar** | Click the 🔍 **MiniWorld API Search** icon in the activity bar |

- **Fuzzy Search** — Type keywords to fuzzy-match API names, parameters, and descriptions (e.g., `GP` matches `GetPosition`)
- **Filters** — Filter by version (2.0 / 3.0), module, and type (function / enum / event)
- **Detail View** — Click a result to see full parameter lists, return values, and more
- **Click to Navigate** — Click any result to jump to the declaration source
- **Quick Clear** — Press `Ctrl+K` in the search input to clear the query

### ⚡ Event Completion

Automatically provides event parameter completion when writing event handler functions, reducing boilerplate and errors.

## First-Time Setup

When you open any `.lua` file, the extension automatically checks whether declaration paths are configured. If not, a prompt appears:

| Option | Behavior |
| :-: | :-: |
| **Don't add declarations** | Suppress prompt for 4 hours |
| **Never remind** | Suppress prompt permanently |
| **Add 2.0 / 3.0 declarations** | Show scope picker to write declaration paths to the selected scope |

## Requirements

- [VS Code](https://code.visualstudio.com/) ^1.125.0
- [Lua Language Server extension (sumneko.lua)](https://marketplace.visualstudio.com/items?itemName=sumneko.lua) — automatically installed as a dependency

## Extension Commands

| Command | Description |
| :-: | :-: |
| `MiniWorld API Description: Add MiniWorld UGC 2.0 Declarations` | Add 2.0 declaration directory to `Lua.workspace.library` |
| `MiniWorld API Description: Remove MiniWorld UGC 2.0 Declarations` | Remove 2.0 declaration directory from config |
| `MiniWorld API Description: Add MiniWorld UGC 3.0 Declarations` | Add 3.0 declaration directory to `Lua.workspace.library` |
| `MiniWorld API Description: Remove MiniWorld UGC 3.0 Declarations` | Remove 3.0 declaration directory from config |
| `MiniWorld API Description: Open API Search` | Open the API search panel |
| `MiniWorld API Description: Refresh API Search Index` | Rescan declaration files to update search index |

## Compatibility

| Project | Version |
| :-: | :-: |
| *Mini World* game | v1.56+ |
| UGC SDK | 3.0 & 2.0 |
| VS Code | ^1.125.0 |

## Notes

- This extension is designed for **UGC 3.0** & **UGC 2.0** only
- Some APIs may differ from the actual game behavior; always refer to the game for the final word
- For issues or feature requests, please open an [Issue](https://github.com/LK-cmyk/MiniWorld-API-Desc/issues)

## License

[MIT](https://github.com/LK-cmyk/MiniWorld-API-Desc/blob/main/LICENSE)

# MiniWorld API Description

![VS Code](https://img.shields.io/badge/VS%20Code-^1.125.0-blue)
![Lua](https://img.shields.io/badge/Lua-5.1%2B-yellow)

为《迷你世界》UGC 开发提供 Lua 类型声明、API 搜索和事件补全的 VS Code 扩展。

## 功能

### 📦 类型声明

为 **UGC 3.0** & **UGC 2.0** 提供完整的 Lua 类型声明文件，配合 [Lua 语言服务（sumneko.lua）](https://marketplace.visualstudio.com/items?itemName=sumneko.lua) 实现：

- 智能自动补全
- 类型提示与参数文档
- 内联函数签名

按下 `Ctrl+Shift+P`，运行以下任一命令开始使用：

| 命令 | 说明 |
| :-: | :-: |
| `MiniWorld API Description: 添加 MiniWorld UGC 2.0 声明` | 将 2.0 声明添加到 `Lua.workspace.library` |
| `MiniWorld API Description: 添加 MiniWorld UGC 3.0 声明` | 将 3.0 声明添加到 `Lua.workspace.library` |

2.0 与 3.0 声明为互斥关系，不可同时共存。

### 🔍 API 搜索

在 VS Code 侧边栏中直接搜索所有 MiniWorld API，无需离开编辑器翻阅文档。

| 方式 | 操作 |
| :-: | :-: |
| **命令面板** | `Ctrl+Shift+P` → **MiniWorld API Description: 打开 API 搜索** |
| **侧边栏按钮** | 点击左侧活动栏的 🔍 **MiniWorld API 搜索** 图标 |

- **模糊搜索** — 输入关键词即可按名称、参数、描述进行模糊匹配（如 `GP` 匹配 `GetPosition`）
- **筛选过滤** — 支持按版本（2.0 / 3.0）、模块、类型（函数 / 枚举 / 事件）筛选
- **详情查看** — 点击结果查看完整的参数列表、返回值等
- **点击跳转** — 点击结果条目跳转到声明源码位置
- **快速清空** — 在搜索输入框中按 `Ctrl+K` 清空查询内容

### ⚡ 事件补全

编写事件处理函数时自动提供事件参数补全，减少样板代码和错误。

## 首次使用

打开任意 `.lua` 文件时，插件会自动检测声明路径是否已配置。若未配置，弹出提示窗口：

| 选项 | 行为 |
| :-: | :-: |
| **不添加声明** | 4 小时内不再提示 |
| **永不提醒** | 永久不再提示 |
| **添加 2.0 / 3.0 声明** | 弹出范围选择，将声明路径写入指定作用域 |

## 依赖要求

- [VS Code](https://code.visualstudio.com/) ^1.125.0
- [Lua 语言服务插件（sumneko.lua）](https://marketplace.visualstudio.com/items?itemName=sumneko.lua) — 自动作为依赖安装

## 扩展命令

| 命令 | 说明 |
| :-: | :-: |
| `MiniWorld API Description: 添加 MiniWorld UGC 2.0 声明` | 将 2.0 声明目录添加到 `Lua.workspace.library` |
| `MiniWorld API Description: 移除 MiniWorld UGC 2.0 声明` | 从配置中移除 2.0 声明目录 |
| `MiniWorld API Description: 添加 MiniWorld UGC 3.0 声明` | 将 3.0 声明目录添加到 `Lua.workspace.library` |
| `MiniWorld API Description: 移除 MiniWorld UGC 3.0 声明` | 从配置中移除 3.0 声明目录 |
| `MiniWorld API Description: 打开 API 搜索` | 打开 API 搜索面板 |
| `MiniWorld API Description: 刷新 API 搜索索引` | 重新扫描声明文件，更新搜索索引 |

## 兼容性

| 项目 | 版本 |
| :-: | :-: |
| 《迷你世界》游戏 | v1.56+ |
| UGC 开发套件 | 3.0 & 2.0 |
| VS Code | ^1.125.0 |

## 注意事项

- 本扩展仅面向 **UGC 3.0** & **UGC 2.0**
- 部分接口可能与实际游戏版本存在差异，请以游戏实际行为为准
- 如发现问题或需要补充 API，欢迎提交 [Issue](https://github.com/LK-cmyk/MiniWorld-API-Desc/issues)

## 许可

[MIT](https://github.com/LK-cmyk/MiniWorld-API-Desc/blob/main/LICENSE)
