# EndPoint Guardian Ops · Docusaurus Site

Docusaurus v3 site for the EndPoint Guardian Ops（終端防護攻防隊）社團。內容涵蓋關於我們、幹部、社團活動、最新公告（Blog）、社團章程，以及加入/聯絡資訊。

## 開發

```bash
npm install
npm run start   # 本機啟動，預設 http://localhost:3000
```

## 建置

```bash
npm run build
```

輸出會在 build/ 目錄。

## 部署到 GitHub Pages

本倉庫為 user/org site，baseUrl 設為 `/`。

```bash
GIT_USER=<your_git_username> npm run deploy
```

- 預設推送到 gh-pages 分支（可在 docusaurus.config.ts 調整 deploymentBranch）。
- GitHub Pages 設定需指向該分支。
- 已提供 GitHub Actions 工作流程：`.github/workflows/deploy.yml`（push main 會自動 build + deploy）。

## 結構
- docs/：主要內容（關於、幹部、活動、公告總覽、章程、加入/聯絡）。
- blog/：最新公告與更新。
- src/pages/index.tsx：首頁英雄區、快速導覽、近期焦點。
- static/：靜態資源（logo）。

---

**CI Test:** Triggering GitHub Actions workflow to verify `build` and `deploy` on 2025-12-15.