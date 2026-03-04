// app/api/cron/check-deadlines/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const CRON_FUNCTION_NAME = "check_expired_goals";
const CRON_JOB_NAME = "check-deadlines";
const ERROR_MESSAGE = "Failed to process expired goals";
const SUCCESS_MESSAGE = "Expired goals processed";
const UNAUTHORIZED_MESSAGE = "Unauthorized";

type CronResponse =
  | { success: true; message: string }
  | { success: false; error: string }
  | { error: typeof UNAUTHORIZED_MESSAGE };

function jsonResponse(body: CronResponse, status = 200) {
  return NextResponse.json(body, { status });
}

function unauthorizedResponse() {
  return jsonResponse({ error: UNAUTHORIZED_MESSAGE }, 401);
}

function serverErrorResponse() {
  return jsonResponse({ success: false, error: ERROR_MESSAGE }, 500);
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length);
}

function isAuthorizedRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(`[Cron:${CRON_JOB_NAME}] Missing CRON_SECRET`);
    return false;
  }

  const token = getBearerToken(request);
  return token === cronSecret;
}

async function runExpiredGoalsCheck(): Promise<Error | null> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(CRON_FUNCTION_NAME);
  return error;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedRequest(request)) {
    return unauthorizedResponse();
  }

  const error = await runExpiredGoalsCheck();
  if (error) {
    console.error(`[Cron:${CRON_JOB_NAME}]`, error);
    return serverErrorResponse();
  }

  return jsonResponse({ success: true, message: SUCCESS_MESSAGE });
}
