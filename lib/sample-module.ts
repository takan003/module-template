import "server-only";
import { getAdminDb, FieldValue } from "@/lib/firebase-admin";
import { cachedListRead, invalidateAdminListCache } from "@/lib/list-cache";
import { invalidateReadCache } from "@/lib/read-cache";
import { publishFromModule } from "@/lib/announcements";
import { publishScheduleFromModule } from "@/lib/calendar";

/**
 * server-only 資料存取層示範——模組所有 Firestore 進出都收斂在這裡。
 *
 * 鐵律（docs/資料庫讀取規範.md）：
 * - 過濾下推：where 在伺服器收乾淨，不拉回來再篩
 * - 禁 N+1：列表一次拉；名稱等去正規化欄位（寫入時存進文件）
 * - 快取＋寫後失效：列表走 cachedListRead，寫入後 invalidateAdminListCache／invalidateReadCache
 * - 宣告即承諾：只讀寫 manifest.dataCollections 所列集合；掛勾集合一律走 publish 介面
 */

const COLLECTION = "sampleEvents";

export interface SampleEvent {
  id: string;
  title: string;
  status: "open" | "closed";
  createdAt?: number;
}

/** 讀取示範：過濾下推＋列表快取 */
export async function listEvents(status: SampleEvent["status"]): Promise<SampleEvent[]> {
  return cachedListRead(`sample:events:${status}`, async () => {
    const snap = await getAdminDb()
      .collection(COLLECTION)
      .where("status", "==", status)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    return snap.docs.map((doc) => {
      const data = doc.data() as { title?: string; status?: string; createdAt?: { toMillis?: () => number } | number };
      return {
        id: doc.id,
        title: String(data.title ?? ""),
        status: (data.status ?? "open") as SampleEvent["status"],
        createdAt:
          typeof data.createdAt === "number"
            ? data.createdAt
            : data.createdAt && typeof data.createdAt.toMillis === "function"
              ? data.createdAt.toMillis()
              : undefined,
      };
    });
  });
}

/** 寫入示範：transaction 查重＋寫後雙快取失效＋稽核由呼叫端 API 負責 */
export async function upsertEvent(id: string, title: string): Promise<void> {
  const db = getAdminDb();
  await db.runTransaction(async (tx) => {
    const ref = db.collection(COLLECTION).doc(id);
    const existing = await tx.get(ref);
    if (existing.exists) {
      tx.update(ref, { title, updatedAt: FieldValue.serverTimestamp() });
    } else {
      tx.set(ref, {
        title,
        status: "open",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
  await invalidateAdminListCache();
  invalidateReadCache("sample:events");
}

/** 掛鉤示範：回寫主程式公告與行事曆——禁止直寫 announcements／calendarEvents 集合 */
export async function announceOpening(params: {
  eventId: string;
  title: string;
  body: string;
  authorUid: string;
  authorName: string;
  examAtMs: number;
  location?: string;
}): Promise<void> {
  await publishFromModule({
    sourceModule: "sampleModule",
    sourceRef: params.eventId,
    title: params.title,
    body: params.body,
    authorUid: params.authorUid,
    authorName: params.authorName,
    authorRole: "staff",
    audience: { kind: "all" },
  });
  await publishScheduleFromModule({
    sourceModule: "sampleModule",
    sourceRef: `sample:${params.eventId}`,
    title: params.title,
    startAt: params.examAtMs,
    location: params.location,
    createdBy: { uid: params.authorUid, name: params.authorName, role: "staff" },
  });
}
