# Attachment Imagebed Manager

Upload your Obsidian note attachments to the cloud and replace local links with remote URLs.

[中文说明](#中文说明)

---

## Quick Start

1. Install the plugin and open **Settings → Attachment Imagebed Manager**
2. Under **Step 1: Connect your cloud storage**, choose a provider (Cloudflare R2 recommended)
3. Fill in your credentials and click **Test connection**
4. Open a note and click the cloud icon in the left sidebar — done!

## What It Does

- Scans your notes for local attachments (images, PDFs, audio, video, etc.)
- Uploads them to S3-compatible cloud storage (Cloudflare R2, AWS S3, MinIO, etc.)
- Replaces the local links in your notes with remote URLs
- Optionally deletes the local files after replacement

## Features

- **S3-compatible storage**: Cloudflare R2, AWS S3, MinIO, or any S3-compatible provider
- **Mobile compatible**: Works on both desktop and mobile Obsidian (manual upload only on mobile)
- **Category-based UI**: Browse attachments by type — Images, Videos, Audio, Documents — with list and gallery views
- **Custom extensions**: Add your own file types (e.g. `.sketch`, `.fig`, `.psd`)
- **Safe replacement**: Atomic note writes with concurrent-edit detection; failed uploads are auto-rolled-back
- **Upload retry**: 3 retries with exponential backoff on transient failures
- **Delete policies**: Ask before delete, immediate trash, or delayed delete (desktop only)
- **Auto scan**: Periodic vault-wide scanning with quiet-period and file-size filtering (desktop only)
- **Dry-run mode**: Preview what would be replaced without making changes
- **Bilingual UI**: English and Chinese (简体中文)
- **Code-block aware**: Links inside fenced code blocks and inline code are ignored

## Installation

### From Obsidian Community Plugins

1. Open Obsidian → Settings → Community Plugins → Browse
2. Search for "Attachment Imagebed Manager"
3. Click Install, then Enable

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/perinchiang/obsidian-plugins-attachment-imagebed-manager/releases)
2. Copy them to `<vault>/.obsidian/plugins/attachment-imagebed-manager/`
3. Enable the plugin in Obsidian → Settings → Community Plugins

## Configuration

### Step 1: Connect Your Cloud Storage

Choose your storage provider and fill in the credentials:

| Field | Description |
|-------|-------------|
| **Storage provider** | Cloudflare R2 (recommended), AWS S3, MinIO, or Custom S3 |
| **Endpoint URL** | Your storage endpoint, e.g. `https://abc123.r2.cloudflarestorage.com` |
| **Bucket name** | The bucket you created |
| **Access Key ID** | From your storage provider's API settings |
| **Secret Access Key** | From your storage provider's API settings |
| **Public access URL** | URL prefix for accessing files, e.g. `https://pub-xxx.r2.dev` |
| **Upload path template** | Default: `attachments/{ext}/{hash2}/{hash}.{ext}` (works for most cases) |

Click **Test connection** to verify your settings.

### Step 2: General Settings

- **Attachment folder**: Only files under this folder are processed (default: `99 Attachments`)
- **Delete policy**: What to do with local files after replacement
  - *Ask me each time* (recommended) — shows a confirmation dialog
  - *Delete immediately* — trashes local files right away
  - *Delete after a delay* — schedules deletion after configurable hours (desktop only)
- **Auto-scan vault periodically**: Automatically find and replace eligible attachments (desktop only)
  - **Scan interval**: How often to scan (default: 30 minutes)
  - **Skip recently modified files**: Files modified within this time are skipped (default: 600 seconds)
  - **Minimum file size**: Ignore files smaller than this threshold in auto-scan

### Step 3: Choose File Types (Desktop Only)

This section appears only when auto-scan is enabled. It lets you configure which file types are included in scheduled scans:

- Toggle entire categories (Images, Videos, Audio, Documents)
- Click individual extensions to toggle them
- Mark extensions as "Scheduled" to include them in auto-scan
- Add custom file types (e.g. `sketch`, `fig`, `psd`)

## Usage

### Scan Current Note (All Platforms)

Click the cloud upload icon in the sidebar, or use the command palette:
- **Scan current note attachments** — shows eligible attachments in a modal with category filters, list/gallery views, and a select-all checkbox

### Vault-wide Preview (Desktop)

Command palette → **Scan vault candidates without replacing** — preview mode, no changes made.

### Auto Scan (Desktop Only)

Enable in settings → **Auto-scan vault periodically**. The plugin will automatically upload and replace eligible attachments in the background.

### Process Delayed Deletes (Desktop)

Command palette → **Process delayed attachment deletes** — manually trigger pending delayed deletions.

## Mobile Notes

On mobile devices:
- Manual upload and replacement works normally
- Scheduled auto-scan is disabled (to preserve battery and avoid background restrictions)
- Delayed delete policy is not available (use "Ask me each time" or "Delete immediately")
- File type configuration (Step 3) is hidden since it only applies to auto-scan

## Building from Source

```bash
git clone https://github.com/perinchiang/attachment-imagebed-manager.git
cd attachment-imagebed-manager
npm install
npm run dev    # watch mode
npm run build  # production build
```

## Security

- Credentials are stored locally in `data.json`. **Do not sync `data.json` to public repositories.**
- `data.json` is included in `.gitignore` by default.
- If you accidentally commit `data.json`, rotate your S3 credentials immediately.

## License

MIT

---

## 中文说明

将 Obsidian 笔记中的本地附件上传到云存储，并将本地链接替换为远程 URL。

### 快速上手

1. 安装插件，打开 **设置 → 附件图床管理器**
2. 在 **第一步：连接云存储** 中选择服务商（推荐 Cloudflare R2）
3. 填写凭据，点击 **测试连接** 验证
4. 打开一篇笔记，点击左侧栏的云图标 — 完成！

### 功能

- **S3 兼容存储**: 支持 Cloudflare R2、AWS S3、MinIO 及任意 S3 兼容服务
- **移动端兼容**: 桌面端和移动端均可使用（移动端仅支持手动上传）
- **分类浏览**: 按图片、视频、音频、文档分类浏览附件，支持列表和画廊视图
- **自定义后缀**: 可添加自定义文件类型（如 `.sketch`、`.fig`、`.psd`）
- **安全替换**: 原子写入，检测并发编辑；上传失败时自动回滚
- **上传重试**: 网络错误时自动重试 3 次（指数退避）
- **删除策略**: 每次询问 / 立即删除 / 延迟删除（仅桌面端）
- **自动扫描**: 定时全库扫描，支持静默期和文件大小过滤（仅桌面端）
- **预览模式**: 全库扫描预览，不实际替换
- **双语界面**: 中文和英文
- **代码块感知**: 忽略代码块和行内代码中的链接

### 配置

#### 第一步：连接云存储

选择存储服务商并填写凭据：

| 字段 | 说明 |
|------|------|
| **存储服务商** | Cloudflare R2（推荐）、AWS S3、MinIO、自定义 S3 |
| **端点 URL** | 存储端点，如 `https://abc123.r2.cloudflarestorage.com` |
| **存储桶名称** | 你创建的存储桶 |
| **Access Key ID** | 在存储服务商的 API 设置中获取 |
| **Secret Access Key** | 在存储服务商的 API 设置中获取 |
| **公开访问 URL** | 上传文件的访问前缀，如 `https://pub-xxx.r2.dev` |
| **上传路径模板** | 默认：`attachments/{ext}/{hash2}/{hash}.{ext}`（适用于大多数情况） |

点击 **测试连接** 验证设置。

#### 第二步：基本设置

- **附件文件夹**: 只处理此文件夹下的文件（默认：`99 Attachments`）
- **删除策略**: 替换链接后本地文件的处理方式
  - *每次询问我*（推荐）— 弹出确认对话框
  - *替换后立即删除* — 直接移入回收站
  - *延迟删除* — 在指定小时后移入回收站（仅桌面端）
- **定期自动扫描全库**: 自动在后台查找并替换符合条件的附件（仅桌面端）
  - **扫描间隔**: 多久扫描一次（默认：30 分钟）
  - **跳过最近修改的文件**: 在此时间内修改过的文件会被跳过（默认：600 秒）
  - **最小文件大小**: 自动扫描忽略小于此大小的文件

#### 第三步：选择文件类型（仅桌面端）

此部分仅在开启自动扫描时显示，用于配置定时扫描包含的文件类型：

- 按分类切换（图片、视频、音频、文档）
- 点击单个后缀切换
- 标记为"定时"以加入自动扫描
- 添加自定义文件类型（如 `sketch`、`fig`、`psd`）

### 使用

#### 扫描当前文档（全平台）

点击侧边栏云上传图标，或使用命令面板：
- **扫描当前文档附件** — 在弹窗中按分类浏览、列表/画廊切换、全选附件

#### 全库预览（桌面端）

命令面板 → **扫描全库候选但不替换** — 预览模式，不做任何修改。

#### 自动扫描（仅桌面端）

在设置中开启 **定期自动扫描全库**，插件会自动在后台上传替换符合条件的附件。

#### 处理延迟删除（桌面端）

命令面板 → **处理延迟删除附件** — 手动触发待执行的延迟删除。

### 移动端说明

在移动设备上：
- 手动上传和替换功能正常使用
- 定时自动扫描已禁用（节省电量，避免后台限制）
- 延迟删除策略不可用（请使用"每次询问"或"立即删除"）
- 文件类型配置（第三步）已隐藏，因为仅对自动扫描生效

### 安全

- 凭据存储在本地 `data.json` 中。**不要将 `data.json` 同步到公开仓库。**
- `data.json` 默认已包含在 `.gitignore` 中。
- 如果你不小心提交了 `data.json`，请立即轮换你的 S3 凭据。

### 许可证

MIT
