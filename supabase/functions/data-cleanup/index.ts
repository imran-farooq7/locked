// supabase/functions/data-cleanup/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createEdgeSupabaseClient, handleCors } from "../_shared/cors.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface CleanupConfig {
  days_to_keep: number;
  batch_size: number;
  dry_run: boolean;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const apiKey = authHeader.split("Bearer ")[1];
  if (apiKey !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  try {
    const config: CleanupConfig = await req.json().catch(() => ({
      days_to_keep: 30,
      batch_size: 1000,
      dry_run: false,
    }));

    const supabase = createEdgeSupabaseClient(req);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.days_to_keep);

    const results = {
      jobs_cleaned: 0,
      notifications_cleaned: 0,
      sessions_cleaned: 0,
      dry_run: config.dry_run,
    };

    if (!config.dry_run) {
      // Cleanup old job records
      const { count: jobsCount } = await supabase
        .from("job_queue")
        .delete()
        .in("status", ["completed", "failed"])
        .lt("created_at", cutoffDate.toISOString())
        .select("*", { count: "exact", head: true });

      results.jobs_cleaned = jobsCount || 0;

      // Cleanup old notifications
      const { count: notifCount } = await supabase
        .from("notifications")
        .delete()
        .lt("created_at", cutoffDate.toISOString())
        .eq("read", true)
        .select("*", { count: "exact", head: true });

      results.notifications_cleaned = notifCount || 0;

      // Cleanup old sessions
      const { count: sessionsCount } = await supabase
        .from("sessions")
        .delete()
        .lt("expires_at", new Date().toISOString())
        .select("*", { count: "exact", head: true });

      results.sessions_cleaned = sessionsCount || 0;

      // Vacuum analyze for performance
      await supabase.rpc("vacuum_analyze_tables");
    }

    return new Response(
      JSON.stringify({
        ...results,
        cutoff_date: cutoffDate.toISOString(),
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Data cleanup error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
