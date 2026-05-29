import { redirect } from "next/navigation";
import { createClient, createServiceClient, getUserRole } from "../../../lib/supabase/server";
import AdminSidebar from "./_components/AdminSidebar";
import styles from "./_components/AdminShell.module.css";

export const metadata = { title: "Admin — Virtual Impact" };

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/agent-portal/login?next=/admin");

  const db = createServiceClient();
  const role = await getUserRole(db, user.id);
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
