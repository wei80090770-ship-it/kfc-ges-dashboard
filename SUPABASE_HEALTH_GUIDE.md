# GES Supabase 免費方案維護說明

## 先恢復專案
1. 在 Supabase 控制台按 **Resume project**，等專案恢復。
2. 在 GES 網站測試登入、讀取既有月份、080／4128 分析。
3. 在 Supabase 控制台使用備份/匯出功能，另存資料庫備份到安全位置。GitHub 靜態網頁程式碼不包含資料庫資料。

## GitHub Actions 健康檢查
新增 `.github/workflows/supabase-health.yml`：每週一台灣時間約 10:00 檢查 Supabase Auth 健康端點；也可在 GitHub > Actions > Supabase Health Check > Run workflow 手動執行。

- 成功只代表 Auth 健康端點有回應，不代表登入、RLS、資料庫表格或資料完整性正常。
- 失敗可在 Actions 執行紀錄看到；通知是否寄送，依 GitHub 帳號通知設定而定。
- **健康檢查不保證避免 Supabase 免費方案自動暫停**，也不會自動恢復專案。
- GitHub 排程可能延遲或在某些條件下停用；不要把它當作正式監控或備份。
- 此工作流程只發送 GET，不寫入業務資料、不使用 service_role 密鑰。

## 現有網站狀態
保留 v8.17 原本的登入與 IndexedDB 快取，沒有改動任何營運分析、匯入或權限邏輯。

## 重要安全事項
Supabase 的 publishable key 可放在前端；資料存取安全性仍依賴 Supabase Row Level Security (RLS) 及適當政策。請確認所有含營運資料的表格都有啟用 RLS 並限制授權使用者。不要將 service_role key 或帳號密碼提交至 GitHub。

## 備份
建議每月匯入後，另行備份資料庫；本次沒有建立自動備份（需要確認備份方式及憑證保管）。
