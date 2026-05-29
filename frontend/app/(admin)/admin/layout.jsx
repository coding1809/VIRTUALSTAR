import { redirect } from "next/navigation";
import { createClient, getUserRole } from "../../../lib/supabase/server";
import AdminSidebar from "./_components/AdminSidebar";
import styles from "./_components/AdminShell.module.css";

export const metadata = { title: "Admin — Virtual Impact" };

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/agent-portal/login?next=/admin");
  }

  const role = await getUserRole(supabase, user.id);
  if (role !== "admin" && role !== "admin_developer") {
    redirect("/agent-portal/login?denied=1");
  }

  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
