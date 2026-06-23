import { requireVendorMemberships } from "@/lib/auth/require-vendor";

export default async function ProtectedVendorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireVendorMemberships();

  return children;
}
