import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal";
import { toAuthResponse } from "@/lib/dal";
import { enforceRateLimit, RATE } from "@/lib/rate-limit";

/**
 * 學生端 API 示範（GET 列表）——防護棧順序即約定：
 * 1. 限流  2. 身分把關  3. 業務邏輯（過濾下推＋分頁＋快取）
 * RATE.SAMPLE_MODULE_LIST 由 manifest.rateLimits 自動併入（前綴＝value UPPER_SNAKE）。
 */
export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(
    request,
    "sample-module-list",
    RATE.SAMPLE_MODULE_LIST.limit,
    RATE.SAMPLE_MODULE_LIST.windowMs
  );
  if (limited) return limited;

  const { session, denial } = await requireRole("student");
  if (denial) return toAuthResponse(denial);

  // 業務邏輯：見 lib/sample-module.ts 的 listEvents 範例（過濾下推＋cachedListRead）
  return NextResponse.json(
    { success: true, message: "尚未實作", uid: session.uid },
    { headers: { "Cache-Control": "no-store" } }
  );
}
