# 技术规范文档

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 31 |
| 前端框架 | React 18 + TypeScript 5 |
| 构建工具 | Vite 5 |
| CSS 框架 | Tailwind CSS 3 |
| 状态管理 | Zustand 4 |
| 打包工具 | electron-builder 24 |

## 项目架构

```
┌─────────────────────────────┐
│      Electron Main          │  主进程：文件系统、API 调用
│  (electron/main.ts)         │
├─────────────────────────────┤
│      Electron Preload       │  安全的 IPC 桥接
│  (electron/preload.ts)      │
├─────────────────────────────┤
│      React App              │  渲染进程：UI
│  (src/)                     │
│  ├── components/            │  组件层
│  ├── store/                 │  状态管理
│  ├── types/                 │  类型定义
│  └── utils/                 │  工具函数
└─────────────────────────────┘
```

## 数据流设计

### 文件存储
- **位置**：`%USERPROFILE%/录音文件/`
  - `audio/` — 音频文件副本
  - `metadata.json` — 文件元数据
- **metadata.json 结构**：
```json
{
  "files": [
    {
      "id": "uuid",
      "fileName": "会议录音.mp3",
      "originalPath": "D:/原路径/会议录音.mp3",
      "duration": 125.5,
      "fileSize": 2048000,
      "createdAt": "2026-05-18T10:30:00.000Z",
      "isPinned": false,
      "status": "done",
      "transcription": "识别出的文字内容..."
    }
  ]
}
```

### IPC 通信
所有主进程操作通过 IPC 通道调用：
- `file:upload` — 上传/导入音频文件
- `file:delete` — 删除文件
- `file:pin` — 切换置顶状态
- `file:list` — 获取文件列表
- `transcribe:start` — 开始语音识别
- `export:txt` — 导出 TXT
- `export:docx` — 导出 Word
- `settings:get-key` / `settings:set-key` — API Key 管理

## API 说明

### Whisper API
- **端点**：`POST https://api.openai.com/v1/audio/transcriptions`
- **参数**：
  - `model`: `whisper-1`
  - `language`: `zh`（中文为主时指定，也可不指定让其自动检测）
  - `response_format`: `text` 或 `verbose_json`
- **认证**：`Authorization: Bearer {API_KEY}`
- **限制**：单文件最大 25MB

## 安全策略
- API Key 使用 electron-store 加密存储
- 启用 contextIsolation，关闭 nodeIntegration
- 文件操作限定在 `%USERPROFILE%/录音文件/` 目录内
- 不上传用户数据到除 OpenAI 以外的任何服务器
