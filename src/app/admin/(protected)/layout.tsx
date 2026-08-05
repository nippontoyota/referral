import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import { isAuthenticated } from "@/lib/session";

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-full flex-col">
      <AdminNav />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] md:px-6 md:py-12">
        {children}
      </main>
    </div>
  );
}
