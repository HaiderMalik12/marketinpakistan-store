import Link from "next/link";
import { getCollectionProducts, products } from "@/app/data/products";
import { ProductCard } from "@/app/components/product-card";

export default function Home() {
  const saleProducts = getCollectionProducts("winter-clearance");
  const collage = saleProducts.slice(0, 4);

  return (
    <main className="flex-1 bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 px-4 py-12 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Left Content */}
            <div className="order-2 md:order-1">
              <p className="text-rose-600 font-semibold text-sm md:text-base mb-2 uppercase tracking-wide">
                Winter Clearance Sale
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                Premium Winter Collection
              </h1>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed max-w-md">
                Warm, premium unstitched suits from our latest volumes. Direct from our Faisalabad factory to your door.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-col gap-3 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-xl">✓</span>
                  <span className="text-gray-700">Direct from Factory</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📦</span>
                  <span className="text-gray-700">Cash on Delivery — Pakistan Wide</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏭</span>
                  <span className="text-gray-700">Premium Quality Guaranteed</span>
                </div>
              </div>

              {/* CTA Button */}
              <Link
                href="/winter-clearance"
                className="inline-block bg-rose-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-rose-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Shop Winter Sale →
              </Link>
            </div>

            {/* Right Image */}
            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-200 to-pink-200 rounded-3xl blur-xl opacity-50"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden p-6">
                  <div className="grid grid-cols-2 gap-3">
                    {collage.map((product) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={product.id}
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-40 md:h-48 object-cover rounded-xl"
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-center text-lg font-bold text-gray-900">
                    Winter Clearance Sale
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="collection" className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          All Designs
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-10 px-4 text-center">
        <p className="text-2xl font-bold mb-1">Market in Pakistan</p>
        <p className="text-sm text-gray-400 mb-6">Premium Eastern Dresses</p>
        <p className="mb-2">📱 WhatsApp: 0305-7252013</p>
        <p className="mb-2">📍 Faisalabad, Pakistan</p>
        <p className="text-gray-500 text-sm mt-6">
          © 2026 marketinpakistan. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
