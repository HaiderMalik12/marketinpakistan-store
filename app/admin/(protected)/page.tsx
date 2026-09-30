import { requireAdmin } from "@/app/lib/session";

export default async function AdminHomePage() {
  await requireAdmin();

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Products</h1>
      <p className="text-gray-600 mt-2">Signed in. Product management arrives in Phase 3.</p>
    </main>
  );
}
