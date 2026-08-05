import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/LoginForm";
import { isAuthenticated } from "@/lib/session";

export default async function AdminLoginPage() {
  if (await isAuthenticated()) {
    redirect("/admin/customers");
  }

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] md:py-16">
      <LoginForm />
    </main>
  );
}
