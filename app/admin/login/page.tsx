import { redirect } from "next/navigation";
import { isAdmin } from "@/app/lib/session";
import { LoginForm } from "@/app/admin/login/login-form";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">Market in Pakistan</p>
        <LoginForm />
      </div>
    </main>
  );
}
