import Link from "next/link";
import { ProductRowActions } from "@/app/components/admin/product-row-actions";
import { requireAdmin } from "@/app/lib/session";
import { listAllProducts, listCollections } from "@/app/lib/products";
import { optimizedImage } from "@/app/lib/images";

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdmin();
  const { filter = "all" } = await searchParams;

  const [all, collections] = await Promise.all([listAllProducts(), listCollections()]);
  const products =
    filter === "all"
      ? all
      : filter === "hidden"
        ? all.filter((p) => p.status === "hidden")
        : all.filter((p) => p.collections.includes(filter));

  const tabs = [
    { key: "all", label: "All" },
    ...collections.map((c) => ({ key: c.slug, label: c.title })),
    { key: "hidden", label: "Hidden" },
  ];
  const collectionTitle = (slug: string) => collections.find((c) => c.slug === slug)?.title ?? slug;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{all.length} in total</p>
        </div>
        <Link
          href="/admin/new"
          className="min-h-12 inline-flex items-center px-6 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-700"
        >
          Add product
        </Link>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Filter products">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/admin" : `/admin?filter=${t.key}`}
            aria-current={filter === t.key ? "page" : undefined}
            className={`min-h-11 inline-flex items-center px-4 rounded-full text-sm font-medium border ${
              filter === t.key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {products.length === 0 ? (
        <p className="text-gray-500 py-10 text-center">No products here yet.</p>
      ) : (
        <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
          {products.map((p) => (
            <li key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 shrink-0 rounded-lg bg-rose-100 overflow-hidden">
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={optimizedImage(p.images[0], 160)} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {[p.catalog, p.collections.map(collectionTitle).join(", ")].filter(Boolean).join(" · ")}
                  </div>
                  <div className="text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-gray-900">PKR {p.price.toLocaleString()}</span>
                    <span className={p.quantity === 0 ? "text-rose-700 font-medium" : "text-gray-600"}>
                      {p.quantity === 0 ? "Sold out" : `${p.quantity} in stock`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === "live" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {p.status === "live" ? "Live" : "Hidden"}
                    </span>
                  </div>
                </div>
              </div>
              <ProductRowActions id={p.id} name={p.name} status={p.status} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
