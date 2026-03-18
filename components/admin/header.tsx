import { User } from "@supabase/supabase-js";
import LogoutButton from "@/components/auth/logout-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminHeader() {
  const supabase = await createSupabaseServerClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 lg:px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-600 mt-1">{user!.email}</p>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
