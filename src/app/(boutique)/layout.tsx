import EnTete from "@/components/boutique/EnTete";
import PiedDePage from "@/components/boutique/PiedDePage";
import { PanierProvider } from "@/components/boutique/Panier";

export default function LayoutBoutique({ children }: { children: React.ReactNode }) {
  return (
    <PanierProvider>
      <div className="min-h-screen flex flex-col">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-or text-noir px-4 py-2">Aller au contenu</a>
        <EnTete />
        <div id="contenu" className="flex-1">{children}</div>
        <PiedDePage />
      </div>
    </PanierProvider>
  );
}
