import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { inArray, eq } from "drizzle-orm";
import { db, neonDb, studentsTable, studentAccountsTable, pesanPribadiTable } from "@workspace/db";
import { requireAuth, getCurrentGuru } from "../lib/auth";

const router: IRouter = Router();

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Map from tomatStudentId → { namaLengkap, kelas } for the guru's school. */
async function buildStudentNameMap(school: string) {
  const accounts = await db.select().from(studentAccountsTable);
  if (accounts.length === 0) return new Map<string, { namaLengkap: string; kelas: string }>();

  const studentIds = accounts.map((a) => a.studentId);
  const students = await db
    .select({ id: studentsTable.id, namaLengkap: studentsTable.namaLengkap, kelas: studentsTable.kelas })
    .from(studentsTable)
    .where(inArray(studentsTable.id, studentIds));

  const studentById = new Map(students.map((s) => [s.id, s]));
  const map = new Map<string, { namaLengkap: string; kelas: string }>();
  for (const acc of accounts) {
    const s = studentById.get(acc.studentId);
    if (s) map.set(acc.tomatStudentId, { namaLengkap: s.namaLengkap, kelas: s.kelas });
  }
  return map;
}

// ── GET /inbox/unread-count ────────────────────────────────────────────────────
// For the sidebar nav badge.
router.get("/inbox/unread-count", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const result = await neonDb.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text as count
    FROM pesan_pribadi
    WHERE recipient_id = ${guru.id}
      AND recipient_role = 'guru'
      AND sender_role = 'siswa'
      AND read_at IS NULL
  `);
  const count = parseInt((result.rows[0] as any)?.count ?? "0", 10);
  res.json({ count });
});

// ── GET /inbox ─────────────────────────────────────────────────────────────────
// Returns conversation list: one entry per student, sorted by latest message.
router.get("/inbox", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Get all conversations involving this guru from Neon
  type ConvRow = {
    student_id: string;
    last_body: string;
    last_sender_role: string;
    last_at: string;
    unread_count: string;
  };

  const rows = await neonDb.execute<ConvRow>(sql`
    WITH msgs AS (
      SELECT
        CASE WHEN sender_role = 'siswa' THEN sender_id ELSE recipient_id END AS student_id,
        id,
        body,
        sender_role,
        created_at,
        read_at
      FROM pesan_pribadi
      WHERE (recipient_id = ${guru.id} AND recipient_role = 'guru')
         OR (sender_id    = ${guru.id} AND sender_role    = 'guru')
    ),
    latest AS (
      SELECT student_id, MAX(id) AS latest_id FROM msgs GROUP BY student_id
    ),
    unread AS (
      SELECT student_id, COUNT(*) AS unread_count
      FROM msgs
      WHERE sender_role = 'siswa' AND read_at IS NULL
      GROUP BY student_id
    )
    SELECT
      m.student_id,
      m.body            AS last_body,
      m.sender_role     AS last_sender_role,
      m.created_at::text AS last_at,
      COALESCE(u.unread_count, 0)::text AS unread_count
    FROM msgs m
    JOIN latest l ON m.id = l.latest_id AND m.student_id = l.student_id
    LEFT JOIN unread u ON m.student_id = u.student_id
    ORDER BY m.created_at DESC
  `);

  if (rows.rows.length === 0) { res.json([]); return; }

  // Enrich with student names from local DB
  const nameMap = await buildStudentNameMap(guru.school ?? "");

  const conversations = rows.rows.map((r: ConvRow) => ({
    studentId: r.student_id,
    namaLengkap: nameMap.get(r.student_id)?.namaLengkap ?? r.student_id,
    kelas: nameMap.get(r.student_id)?.kelas ?? "",
    lastMessage: r.last_body,
    lastSenderRole: r.last_sender_role,
    lastAt: r.last_at,
    unreadCount: parseInt(r.unread_count, 10),
  }));

  res.json(conversations);
});

// ── GET /inbox/:studentId ──────────────────────────────────────────────────────
// Returns all messages in the thread between guru and student.
router.get("/inbox/:studentId", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { studentId } = req.params;

  type MsgRow = {
    id: number;
    sender_id: string;
    sender_role: string;
    body: string;
    created_at: string;
    read_at: string | null;
  };

  const rows = await neonDb.execute<MsgRow>(sql`
    SELECT id, sender_id, sender_role, body, created_at::text, read_at::text
    FROM pesan_pribadi
    WHERE (sender_id = ${guru.id}    AND recipient_id = ${studentId})
       OR (sender_id = ${studentId} AND recipient_id = ${guru.id})
    ORDER BY id ASC
  `);

  // Mark all unread messages from this student as delivered (non-destructive)
  await neonDb.execute(sql`
    UPDATE pesan_pribadi
    SET delivered_at = NOW()
    WHERE recipient_id = ${guru.id}
      AND recipient_role = 'guru'
      AND sender_id = ${studentId}
      AND sender_role = 'siswa'
      AND delivered_at IS NULL
  `);

  const messages = rows.rows.map((r: MsgRow) => ({
    id: r.id,
    senderId: r.sender_id,
    senderRole: r.sender_role,
    body: r.body,
    createdAt: r.created_at,
    isRead: r.read_at != null,
  }));

  res.json(messages);
});

// ── PATCH /inbox/:studentId/read ───────────────────────────────────────────────
// Mark all messages from this student to this guru as read.
router.patch("/inbox/:studentId/read", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { studentId } = req.params;

  await neonDb.execute(sql`
    UPDATE pesan_pribadi
    SET read_at = NOW()
    WHERE recipient_id = ${guru.id}
      AND recipient_role = 'guru'
      AND sender_id = ${studentId}
      AND sender_role = 'siswa'
      AND read_at IS NULL
  `);

  res.json({ ok: true });
});

// ── POST /inbox/:studentId ─────────────────────────────────────────────────────
// Send a reply from the guru to the student.
router.post("/inbox/:studentId", requireAuth, async (req, res): Promise<void> => {
  const guru = await getCurrentGuru(req);
  if (!guru) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { studentId } = req.params;
  const body: unknown = req.body?.body;
  if (typeof body !== "string" || body.trim().length === 0 || body.length > 2000) {
    res.status(400).json({ error: "body harus diisi (maks 2000 karakter)" });
    return;
  }
  const trimmedBody = body.trim();

  type InsertedRow = { id: number; created_at: string };

  const result = await neonDb.execute<InsertedRow>(sql`
    INSERT INTO pesan_pribadi (sender_id, sender_role, recipient_id, recipient_role, body)
    VALUES (${guru.id}, 'guru', ${studentId}, 'siswa', ${trimmedBody})
    RETURNING id, created_at::text
  `);

  const row = result.rows[0] as InsertedRow;
  res.status(201).json({
    id: row.id,
    senderId: guru.id,
    senderRole: "guru",
    body: trimmedBody,
    createdAt: row.created_at,
    isRead: false,
  });
});

export default router;
