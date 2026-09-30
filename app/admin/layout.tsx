import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — marketinpakistan",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 bg-gray-50">{children}</div>;
}
