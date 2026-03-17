// app/api/jobs/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user?.id!)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = searchParams.get("limit") || "50";
  const page = searchParams.get("page") || "1";
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from("job_queue")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: jobs, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    jobs,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil((count || 0) / parseInt(limit)),
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user?.id!)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { job_type, payload, priority, scheduled_for } = body;

    const { data: jobId, error } = await supabase.rpc("enqueue_job", {
      p_job_type: job_type,
      p_payload: payload || {},
      p_priority: priority || 3,
      p_scheduled_for: scheduled_for || new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      job_id: jobId,
      message: "Job queued successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to queue job" },
      { status: 500 },
    );
  }
}
