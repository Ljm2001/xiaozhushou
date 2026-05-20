# CLAUDE.md — 录音转文字助手

## 项目简介
一款 Windows 桌面应用（Electron + React），用户可以上传音频文件（mp3/wav/m4a 等），通过 OpenAI Whisper API 在线识别转换为文字，支持中英文混合语音。功能包括文件管理（按时间排序、置顶、删除）、文字查看和导出（TXT/Word）。

---

## 规范文档路径

| 文档 | 路径 | 用途 |
|------|------|------|
| 需求文档 | [docs/requirements.md](docs/requirements.md) | 功能需求清单、用户场景、验收标准 |
| 技术规范 | [docs/tech-specs.md](docs/tech-specs.md) | 技术栈、架构、数据流、API、安全策略 |
| 设计规范 | [docs/design-specs.md](docs/design-specs.md) | 配色、字体、组件尺寸、间距、交互 |
| 执行步骤 | [docs/execution-steps.md](docs/execution-steps.md) | 分阶段开发任务和进度状态 |

---

## 开发日志

日志按日期存放在 [dev-logs/](dev-logs/) 目录下，文件名为 `YYYY-MM-DD.md`。

每天开发结束前写入当日：
- 完成事项
- 待办事项
- 遇到的问题

---

## 工作约定

1. **每次只推进一个阶段**，阶段内任务按顺序执行，不跳跃
2. **开始每个阶段前**，先读取 [docs/execution-steps.md](docs/execution-steps.md) 确认当前进度
3. **修改代码前**，先读取相关规范文档（UI 改前读设计规范，功能改前读需求文档）
4. **每个阶段完成后**，更新 [docs/execution-steps.md](docs/execution-steps.md) 中的状态标记
5. **每天开发结束前**，在 [dev-logs/](dev-logs/) 写入当日日志
6. **遇到不确定的选择**，停下来询问用户，不自行决定
7. **代码修改后立即验证**，确保编译通过、功能正常
8. **CLAUDE.md 保持最新**，项目结构变化时同步更新本文件

---

## 常用命令

```bash
npm run dev          # 启动开发模式（Vite + Electron）
npm run build        # 构建生产版本
npm run electron:build  # 打包为 .exe 安装包
```
