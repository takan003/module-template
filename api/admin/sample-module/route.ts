import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/csrf";
import { enforceRateLimit, RATE } from "@/lib/rate-limit";
import { requireAdminModule, isSuperAdmin, toAuthResponse } from "@/lib/dal";
import { getClientIp, logActivity } from "@/lib/audit";
import { serverErrorMessage } from "@/lib/api-error";

/**
 * 管理端 API 示範（POST）——防護棧順序即約定：
 * 1. 同源檢查  2. 限流  3. 權限把關（requireAdminModule；高風險操作再加 isSuperAdmin）
 * 4. 業務邏輯（見 lib/sample-module.ts：transaction＋寫後失效）
 * 5. 稽核（logActivity；action 用 manifest.auditActions 宣告的值）
 */
export async function POST(request: NextRequest) {
  try {
    const originDenied = assertSameOrigin(request);
    if (originDenied) return originDenied;

    const limited = enforceRateLimit(
      request,
      "sample-module-admin",
      RATE.SAMPLE_MODULE_MUTATE.limit,
      RATE.SAMPLE_MODULE_MUTATE.windowMs
    );
    if (limited) return limited;

    const { session, denial } = await requireAdminModule("sampleModule");
    if (denial) return toAuthResponse(denial);
    // 高風險操作（全站設定級）才需要：if (!(await isSuperAdmin(session))) { ... 403 }

    void isSuperAdmin; // 示範用；實際使用時移除

    await logActivity({
      userId: session.uid,
      role: "admin",
      action: "sample_module_updated",
      ip: getClientIp(request),
      details: "示範：寫操作後一律稽核",
    });

    return NextResponse.json({ success: false, message: "尚未實作（M1）" }, { status: 501 });
  } catch (error) {
    console.error("Sample module admin POST error:", error);
    return NextResponse.json({ success: false, message: serverErrorMessage(error, "系統錯誤") });
  }
}
