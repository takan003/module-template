import AdminSectionShell from "@/components/AdminSectionShell";

/**
 * 管理端頁面示範：
 * - AdminSectionShell 是「預設導出」，四個 props 都是必填（moduleKey＝manifest.value）
 * - 頁面本身不做權限判斷——外殼已按 moduleKey 閘門（超級管理員全開、其餘看指派）
 */
export default function SampleModuleAdminPage() {
  return (
    <AdminSectionShell
      moduleKey="sampleModule"
      title="示範模組（請改）"
      description="承辦管理介面。"
      deniedMessage="此帳號未被指派此功能模組。"
    >
      <p className="text-sm text-t2">在這裡放你的管理介面。</p>
    </AdminSectionShell>
  );
}
