import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/jost/300.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ÉLYSORA Group — L'art de sublimer votre quotidien", template: "%s · ÉLYSORA Group" },
  description: "Mode, cheveux et parfums d'intérieur. Livraison partout au Canada et à l'international.",
  icons: { icon: "/monogramme.png", apple: "/monogramme.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
