import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin-header";
import "@/components/admin-shell.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-out visitors (e.g. on /admin/login) get the shell's palette/
  // radius but not the header -- a "Sign out" button before ever signing
  // in doesn't make sense.
  return <div className="av-shell">{user ? <AdminHeader email={user.email} /> : null}{children}</div>;
}
