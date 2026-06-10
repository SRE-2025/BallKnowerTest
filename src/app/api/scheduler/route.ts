import { NextResponse } from "next/server";

// POST /api/scheduler — posts all approved packages whose scheduled time is due.
// Point a cron service (Vercel Cron, GitHub Actions, etc.) at this endpoint, or
// run `npm run scheduler`. Database mode only.
export async function POST() {
  if ((process.env.DATA_SOURCE ?? "mock") !== "database") {
    return NextResponse.json({ error: "scheduler runs in database mode (DATA_SOURCE=database)" }, { status: 400 });
  }
  try {
    const { postDuePackages } = await import("@/lib/posting/scheduler");
    const result = await postDuePackages();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "scheduler error" }, { status: 500 });
  }
}
