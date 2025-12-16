# GitHub Pages 部署指南

## 當前配置狀態 ✅

你的網站已經完全配置好，可以部署到 GitHub Pages！

### 已完成的配置

1. **Docusaurus 配置** (`docusaurus.config.ts`)
   - ✅ URL: `https://npu-ego.github.io`
   - ✅ Base URL: `/`
   - ✅ Organization: `NPU-EGO`
   - ✅ Project: `npu-ego.github.io`

2. **GitHub Actions 工作流程** (`.github/workflows/deploy.yml`)
   - ✅ 自動建置與部署
   - ✅ 使用 Node.js 22
   - ✅ 部署到 GitHub Pages

3. **建置測試**
   - ✅ 本地建置成功
   - ✅ 靜態檔案生成於 `build/` 目錄

## 部署步驟

### 1. 在 GitHub 上啟用 GitHub Pages

1. 前往你的 GitHub 倉庫：`https://github.com/NPU-EGO/npu-ego.github.io`
2. 點擊 **Settings** (設定)
3. 在左側選單找到 **Pages**
4. 在 **Source** (來源) 下拉選單中選擇 **GitHub Actions**

### 2. 推送程式碼

```bash
git add .
git commit -m "feat: EGO club website with GitHub Pages deployment"
git push origin main
```

### 3. 監控部署

1. 前往 **Actions** 標籤頁
2. 你會看到 "Deploy to GitHub Pages" 工作流程正在執行
3. 等待綠色勾勾 ✅ 表示部署成功

### 4. 訪問你的網站

部署成功後，你的網站將在以下網址上線：

**https://npu-ego.github.io**

## 自動部署觸發條件

- ✅ 每次推送到 `main` 分支
- ✅ 手動觸發（在 Actions 頁面）

## 故障排除

### 如果部署失敗

1. 檢查 Actions 標籤頁的錯誤訊息
2. 確認 GitHub Pages 設定為 "GitHub Actions"
3. 確認倉庫名稱為 `npu-ego.github.io`（組織/用戶頁面）

### 如果網站顯示 404

1. 等待 5-10 分鐘（GitHub Pages 可能需要時間）
2. 檢查 Settings > Pages 是否顯示網站 URL
3. 確認 `baseUrl` 在 `docusaurus.config.ts` 中設定為 `/`

## 本地預覽建置結果

```bash
npm run build
npm run serve
```

然後訪問 `http://localhost:3000` 查看建置後的網站。

## 更新網站

只需要：

1. 修改檔案
2. Commit 並 push 到 `main` 分支
3. GitHub Actions 會自動重新部署

就這麼簡單！🚀
