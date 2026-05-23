# MiniWorld-API-Docs

![MiniWorld_Icon](./img/MiniWorld_Icon.png)

- 作者: K_Lan
- 游戏版本: v1.55
- `Lua` 版本: v5.1+
- `UGC` 开发套件: v3.0

## 项目简介

本仓库提供《迷你世界》Lua 脚本开发的 API 声明文件和代码片段模板。通过将声明文件加入 `lua.workspace.library`，可以在 VS Code 中消除语法错误提示，提升代码补全体验。

## 目录说明

- `MNDeclaration.d.lua`：全集成声明文件，适合直接导入项目。
- `multiple/`：按模块拆分的声明文件，适合只使用部分模块时加载。
- `template/lua.code-snippets`：VS Code Lua 代码片段模板。
- `AiDesc/`：AI 描述内容，便于喂给智能助手使用。

## 安装与使用

### 1. 使用声明文件

1. 将 `MNDeclaration.d.lua` 或 `multiple/` 文件夹复制到你的项目目录。
2. 打开项目中的 `.vscode/settings.json`。
3. 在配置中添加或更新：

```json
"lua.workspace.library": [
  "./MNDeclaration.d.lua"
]
```

如果你复制的是 `multiple/` 文件夹，则写入该文件夹路径：

```json
"lua.workspace.library": [
  "./multiple"
]
```

- 保存后重启 VS Code 或重新加载窗口，以确保语言服务生效。

### 2. 使用代码片段模板

将 `template/lua.code-snippets` 复制到你的项目 `.vscode/` 目录下即可。

## 下载方式

- 下载 ZIP：仓库页面点击绿色 "<> Code" 按钮，然后选择 "Download ZIP"。
- 克隆仓库：

```bash
git clone https://github.com/LK-cmyk/MiniWorld-API-Docs.git
```

- 下载单个文件：直接打开文件后点击下载按钮。

## 进度说明

以下模块已完成声明：

- 事件
- 枚举库
- 全局函数
- CustomUI
- World
- GameObject
- Actor
- Player
- Item
- Monster
- Block
- Backpack
- Graphics
- Area
- WorldContainer
- Mod
- Timer
- Buff
- Chat
- Data
- Array
- Table
- Map
- Component

## AI 使用提示

- 可将 `MNDeclaration.d.lua` 与 `AiDesc/` 中的内容一起输入 AI，以获得更准确的代码建议。

## 注意事项

- 本仓库声明文件与模板仅支持开发套件 **3.0**。
- 部分接口可能与实际游戏版本存在差异，请以游戏实际行为为准。
- 发现问题欢迎提交 Issues 或 Fork 后发起 Pull Request。
