import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { requireAdmin } from "@/app/lib/session";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  const link = "min-h-11 inline-flex items-center px-1.5 sm:px-2 text-sm font-medium text-gray-700 hover:text-rose-600";

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 min-h-14 flex flex-wrap items-center justify-between gap-x-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden sm:inline font-bold text-gray-900">Admin</span>
            <nav className="flex items-center gap-0.5 sm:gap-3" aria-label="Admin">
              <Link href="/admin" className={link}>Products</Link>
              <Link href="/admin/new" className={link}>Add product</Link>
              <Link href="/" className={link}>
                <span className="sm:hidden">Store</span>
                <span className="hidden sm:inline">View store</span>&nbsp;&#8599;
              </Link>
            </nav>
          </div>
          <form action={logout}>
            <button type="submit" className={`${link} text-gray-500`}>Log out</button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
