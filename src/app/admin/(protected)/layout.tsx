import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import { isAuthenticated } from "@/lib/session";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 md:px-6 md:py-12">
        {children}
      </main>
    </>
  );
}
