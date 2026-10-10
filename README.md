# 模組模板（module-template）

數位校園工具箱**選用（外掛）功能模組**的空白起手式：clone → 改 value → 實作 → 驗證 → 上架。
規格：主程式 repo `docs/主程式模組與功能模組.md`、`docs/模組市集與外掛開發.md`。

## 三步開工

```bash
# 1. 克隆（資料夾名隨意，掛進宿主時以 manifest.value 命名）
git clone https://github.com/takan003/module-template.git myNewModule
cd myNewModule

# 2. 依下方檢查清單改 manifest（最重要：value，需全域唯一）
# 3. 自檢（需 Node ≥20；首次先 npm install 取得 SDK 工具）
npm install
npm run module:check
```

## 改 manifest 檢查清單（module.json）

| 欄位 | 怎麼改 |
|---|---|
| `value` | 你的模組代碼，camelCase、**全域唯一**（先查市集目錄；與內建撞名 check 會報） |
| `label` / `description` | 顯示名稱與說明 |
| `routes` | 你的實際路徑（page 僅限 `/admin` `/student` `/parent` `/staff`；api 需 `/api/` 開頭） |
| `permission` | `mode:"new"` 時 `value` 必須＝value；`category` 三選一 |
| `rateLimits` / `auditActions` | 前綴自動綁 value（UPPER_SNAKE／snake_case）；照樣板加減列 |
| `dataCollections` | 你會讀寫的 Firestore 集合（**宣告即承諾**，多寫一個都過不了檢查） |
| `hooks` | 要回寫系統公告／行事曆才留；不用就整個移除 |
| `minHostVersion` | 你開發時的宿主版本（如 `"0.389"`） |
| `status` / `href` | 開發期 `planned`＋`href:""`；**上架條件＝`live` 且 href 非空** |
| 檔案路徑 | `admin/…` `student/…` `api/…` `lib/…` 與 routes 對齊（實體路徑＝路由路徑鏡像） |

## 本地開發迴路（兩台電腦皆適用）

```bash
# 宿主（campus-toolkit clone）：
npm run module:link -- ../myNewModule --copy --watch
# → win32 用 copy＋watch（junction 不可用【E14】）；改檔自動同步，動 module.json 自動重跑掃描器
npm run dev   # 瀏覽器驗證：/admin/modules 出現卡片（需超級管理員；預設未啟用，開總開關才生效）
npm run lint  # 最終型別判定（eslint＋tsc；比 SDK 影子 tsc 更嚴）
```

同步好處：宿主 `npm run lint`／build 都會自動跑掃描器，manifest 錯誤第一時間點名。

## 程式撰寫約定（模板已示範）

1. **管理頁**：`AdminSectionShell`（預設導出，四 props 必填）——權限閘門外殼包一頁即可
2. **API 防護棧順序**：`assertSameOrigin` → `enforceRateLimit(RATE.X)` → `requireAdminModule`／`requireRole`
   → 業務邏輯 → `logActivity`（見 `api/admin/sample-module/route.ts`）
3. **資料層**：全部收斂在 `lib/<value>.ts`（`server-only`）——過濾下推、禁 N+1、
   `cachedListRead`＋寫後 `invalidateAdminListCache`／`invalidateReadCache`（見 `lib/sample-module.ts`）
4. **回寫公告／行事曆**：只准 `publishFromModule`／`publishScheduleFromModule`（見 `announceOpening` 範例）；
   **禁止**直寫 `announcements`／`calendarEvents` 集合、禁止碰 `settings`
5. **零新依賴**【E10】：`dependencies` 必須空；只准用宿主既有套件（react/next/firebase-admin/xlsx…）
6. 客戶端（`"use client"`）**禁** `localStorage`／`document.cookie`／`eval`

## 四身分手測（上架前）

用不同身分登入宿主驗證：管理員（有/無指派該模組）、學生、家長——可見性、權限不足路徑、API 403。

## 上架前自檢

```bash
npm run module:check        # 靜態掃描零錯誤（市集會用同一把尺複驗）
# 宿主 npm run lint 過；status 改 live、href 補入口；version 遞增；記下資料夾 sha256（市集比對）
```

## 常見錯誤

| 症狀 | 原因 |
|---|---|
| check 報「與內建撞名」 | value 衝突——改名 |
| check 報「未宣告集合」 | 用到沒在 `dataCollections` 宣告的集合——補宣告或改寫 |
| 掛上宿主後 build 報 module not found | 實體路徑與 routes 鏡像不一致（`/admin/foo` → `admin/foo/page.tsx`） |
| 型別錯誤（AdminSectionShell props 等） | 回模板對照 `admin/` 樣板 |
