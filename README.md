# IEEE NPU-EGO 資安攻防隊 (終端防護攻防隊)

IEEE NPU-EGO 終端防護攻防隊官方網站，使用 [Docusaurus](https://docusaurus.io/) 建立。 

## 本地開發

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm start
```

此命令會啟動本地開發伺服器並自動開啟瀏覽器。大部分的修改都會即時反映，無需重新啟動伺服器。

### 建置

```bash
npm run build
```

此命令會將靜態內容生成到 `build` 目錄，可以使用任何靜態內容託管服務來提供服務。

## 部署到 GitHub Pages

本專案已配置 GitHub Actions 自動部署。當你推送到 `main` 分支時，網站會自動建置並部署到 GitHub Pages。

### 首次設定 GitHub Pages

1. 前往 GitHub 倉庫的 **Settings** > **Pages**
2. 在 **Source** 下選擇 **GitHub Actions**
3. 推送到 `main` 分支即可觸發自動部署

### 手動觸發部署

你也可以在 GitHub 倉庫的 **Actions** 頁面手動觸發 "Deploy to GitHub Pages" 工作流程。

## 網站結構

- `src/pages/` - 自訂頁面（首頁、關於我們、活動等）
- `blog/` - 最新公告與部落格文章
- `docs/` - 文件頁面
- `static/` - 靜態資源（圖片、favicon 等）
- `src/css/` - 自訂樣式

## 技術棧

- **框架**: Docusaurus 3.9.2
- **語言**: TypeScript, React
- **部署**: GitHub Pages (自動化 CI/CD)
- **主題**: 自訂深色模式與網路安全風格
