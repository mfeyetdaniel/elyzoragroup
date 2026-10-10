"use client";
import Image from "next/image";
import { useState } from "react";
import type { Image as Img } from "@/lib/catalogue";

export default function Galerie({ images, nom }: { images: Img[]; nom: string }) {
  const [i, setI] = useState(0);
  const active = images[i];
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4">
      {images.length > 1 && (
        <div className="flex sm:flex-col gap-3 overflow-x-auto sm:w-[88px] shrink-0">
          {images.map((im, n) => (
            <button key={im.url} type="button" onClick={() => setI(n)} aria-label={`Photo ${n + 1}`} aria-pressed={n === i}
              className={`relative w-[72px] sm:w-[88px] h-[90px] sm:h-[110px] shrink-0 bg-ivoire border ${n === i ? "border-or" : "border-or-profond/60"}`}>
              <Image src={im.url} alt="" fill sizes="88px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative grow aspect-[4/5] bg-ivoire border border-or-doux/45 overflow-hidden">
        {active && <Image src={active.url} alt={active.alt || nom} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />}
      </div>
    </div>
  );
}
