import { logout } from "@/app/admin/actions";
import { requireAdmin } from "@/app/lib/session";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-gray-900">Market in Pakistan · Admin</span>
          <form action={logout}>
            <button type="submit" className="min-h-11 px-2 text-sm font-medium text-gray-600 hover:text-gray-900">
              Log out
            </button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
