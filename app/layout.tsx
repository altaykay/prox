import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const domain = s.siteDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return {
    title: { default: s.siteName, template: `%s – ${s.siteName}` },
    description: s.metaDescription,
    robots: { index: false, follow: false },
    ...(domain ? { metadataBase: new URL(`https://${domain}`) } : {}),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CH">
      <body>{children}</body>
    </html>
  );
}
