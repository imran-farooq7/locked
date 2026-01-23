import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DASHBOARD_PATH = "/dashboard";
const ERROR_PATH = "/auth/error";

function extractAuthParams(searchParams: URLSearchParams) {
  return {
    tokenHash: searchParams.get("token_hash"),
    type: searchParams.get("type") as EmailOtpType | null,
  };
}

function createRedirectUrl(
  baseUrl: URL,
  pathname: string,
  paramsToRemove: string[] = [],
) {
  const redirectUrl = new URL(baseUrl.toString());
  redirectUrl.pathname = pathname;
  paramsToRemove.forEach((param) => redirectUrl.searchParams.delete(param));
  return redirectUrl;
}

async function verifyEmailOtp(
  tokenHash: string,
  type: EmailOtpType,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });
  return !error;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { tokenHash, type } = extractAuthParams(searchParams);

  // Invalid or missing parameters
  if (!tokenHash || !type) {
    return NextResponse.redirect(
      createRedirectUrl(request.nextUrl, ERROR_PATH),
    );
  }

  // Verify OTP with Supabase
  const isValid = await verifyEmailOtp(tokenHash, type);

  // Determine redirect path based on verification result
  const redirectPath = isValid ? DASHBOARD_PATH : ERROR_PATH;
  const paramsToRemove = ["token_hash", "type", "next"];

  return NextResponse.redirect(
    createRedirectUrl(request.nextUrl, redirectPath, paramsToRemove),
  );
}
