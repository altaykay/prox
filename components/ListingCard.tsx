import Link from "next/link";
import type { Listing, ListingPhoto } from "@prisma/client";
import { CANTONS } from "@/lib/constants";

export function ListingCard({ l }: { l: Listing & { photos: ListingPhoto[] } }) {
  const p = l.photos[0];
  return (
    <Link href={`/annonce/${l.id}`} className="lcard">
      <div className="ph">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p ? <img src={p.url} alt={`Photo de ${l.pseudo}`} className={p.blurred ? "blur" : ""} loading="lazy" /> : l.pseudo.charAt(0)}
      </div>
      <div className="b">
        <div className="n">{l.pseudo}</div>
        <div className="m">{l.city}{CANTONS[l.canton] && CANTONS[l.canton] !== l.city ? ` · ${CANTONS[l.canton]}` : ""}</div>
      </div>
    </Link>
  );
}
