/**
 * 學生端頁面示範：
 * 頁面不做伺服器端身分把關也行（proxy 已擋未登入），但**資料一律走自己的 API**，
 * API 內用 requireRole 把關——頁面永遠不要直連 Firestore（client 端金鑰全拒）。
 */
export default function SampleModuleStudentPage() {
  return (
    <main className="w-full max-w-3xl mb-8 space-y-4">
      <h1 className="text-lg font-bold text-t1">示範模組（請改）</h1>
      <p className="text-sm text-t2">在這裡放你的學生端介面；資料 fetch 自 /api/sample-module。</p>
    </main>
  );
}
