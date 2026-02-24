import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyCompleteToken } from "@/lib/notificationToken";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, token } = body as { taskId?: string; token?: string };

    if (!taskId || !token) {
      return NextResponse.json({ error: "Missing taskId or token." }, { status: 400 });
    }

    const parsed = verifyCompleteToken(token);
    if (!parsed || parsed.taskId !== taskId) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("task_completions")
      .insert({
        task_id: parsed.taskId,
        completed_at: new Date().toISOString(),
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error." },
      { status: 500 }
    );
  }
}
