import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type SupabaseUser = {
  id: string;
  email: string | null;
  created_at: string;
};

type UserProfile = {
  id: string;
  full_name?: string | null;
  stripe_customer_id?: string | null;
};

const UserInfo = async () => {
  const supabase = await createSupabaseServerClient();

  // Server-side session check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If there's no authenticated user, redirect to login on the server
    redirect("/login");
  }

  // Get user profile with Stripe info
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", (user as SupabaseUser).id)
    .single();

  const u = user as SupabaseUser;

  return (
    <div className="rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4">Account Information</h2>
      <div className="space-y-2">
        <p>
          <strong>Email:</strong> {u.email ?? "(no email)"}
        </p>
        <p>
          <strong>Name:</strong> {profile?.full_name || "Not set"}
        </p>
        <p>
          <strong>Stripe Customer:</strong>{" "}
          {profile?.stripe_customer_id ? "✓ Connected" : "Not connected"}
        </p>
        <p>
          <strong>Member since:</strong>{" "}
          {new Date(u.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default UserInfo;
