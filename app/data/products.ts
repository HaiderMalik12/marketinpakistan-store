export type Product = {
  id: string;
  slug: string;
  name: string;
  catalog: string;
  price: number;
  images: string[];
  sizes: string[];
  description: string;
};

// Placeholder catalog — replace with real products, prices, and Cloudinary image
// URLs before sharing this link publicly. Shape matches the future Prisma `Product`
// model in RETAIL_STORE_ARCHITECTURE.md so migrating to the DB in Phase 2 is a
// seed-script copy of this array, not a rewrite.
export const products: Product[] = [
  {
    id: "1",
    slug: "sample-design-1",
    name: "Sample Design 1",
    catalog: "Sample Catalog",
    price: 3500,
    images: ["/images/placeholder.svg"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Replace with a real product description, fabric, and details.",
  },
  {
    id: "2",
    slug: "sample-design-2",
    name: "Sample Design 2",
    catalog: "Sample Catalog",
    price: 4200,
    images: ["/images/placeholder.svg"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Replace with a real product description, fabric, and details.",
  },
  {
    id: "3",
    slug: "sample-design-3",
    name: "Sample Design 3",
    catalog: "Another Catalog",
    price: 5500,
    images: ["/images/placeholder.svg"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Replace with a real product description, fabric, and details.",
  },
];
