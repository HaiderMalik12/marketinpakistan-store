import Link from "next/link";
import { products } from "@/app/data/products";

export default function Home() {
  return (
    <main className="flex-1 bg-white">
      <section className="bg-rose-50 py-16 px-4 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">marketinpakistan</h1>
        <p className="text-xl text-gray-600 mb-2">
          Premium Eastern Dresses — Direct from Factory
        </p>
        <p className="text-gray-500 mb-8">
          Faisalabad Manufacturer | Cash on Delivery Across Pakistan
        </p>
        <a
          href="#collection"
          className="inline-block bg-rose-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-rose-700 transition-colors"
        >
          Shop Now
        </a>
      </section>

      <section id="collection" className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Latest Collection
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="border rounded-xl overflow-hidden shadow-sm block hover:shadow-md transition-shadow"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                <p className="text-gray-500 text-sm">{product.catalog}</p>
                <p className="text-rose-600 font-bold text-lg mt-1">
                  PKR {product.price.toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-10 px-4 text-center">
        <p className="text-xl font-bold mb-4">marketinpakistan</p>
        <p className="mb-2">📱 WhatsApp: 0305-7252013</p>
        <p className="mb-2">📍 Faisalabad, Pakistan</p>
        <p className="text-gray-500 text-sm mt-6">
          © 2026 marketinpakistan. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
