# KFC GES Dashboard v7.0

## 架構
- GitHub Pages：只放網頁程式
- Supabase `ges_responses`：GES 明細唯一保存來源
- 瀏覽器不再保存完整 GES 問卷
- 同一筆資料以「日期＋餐廳＋分數＋評論」SHA-256 去重

## 第一次上線
1. Supabase → SQL Editor → New query。
2. 貼上 `setup_supabase.sql` 全部內容並 Run。
3. GitHub 將本 ZIP 內所有檔案覆蓋原版本。
4. 開啟 Dashboard，右下角應顯示 `GES Dashboard v7.0 · Supabase`。
5. 第一次請重新匯入既有 GES Excel；之後重新整理或換電腦都會由 Supabase 載入。

## 安全
v7.0 因尚未做登入，只允許 anon 讀取與新增，不允許修改/刪除。Publishable key 可放前端；不要把 Secret/service_role key 放到 GitHub。
