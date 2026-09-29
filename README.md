# KFC GES Dashboard

第一版功能：每月匯入 GES Excel，在瀏覽器中分析市場 → 中心 → 餐廳、主要不滿、漏餐與改善趨勢。

## GitHub Pages
1. 將本資料夾全部檔案上傳到 repository 根目錄。
2. GitHub → Settings → Pages。
3. Build and deployment 選 `Deploy from a branch`。
4. Branch 選 `main` / `(root)` → Save。

## 第一版資料保存
目前歷史月份使用瀏覽器 localStorage，先用來驗證版面與分類規則。換電腦/清除瀏覽器資料不會保留。
Supabase 已建立，但正式串接前需先設定安全的 RLS Policy；不要把 Database password 或 service_role key 放進 GitHub。

## Excel 必要欄位
系統會自動嘗試辨識：餐廳名稱、OSAT 整體滿意度分數、OSAT整體滿意度評論、日期；若 Excel 已含中心/Group 也會讀取。

> 下一階段：串接 Supabase restaurant_mapping、保存歷史月份、加入 080 分析。
