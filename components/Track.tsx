"use client";
import { useEffect } from "react";

function send(id: string, type: string) {
  const body = JSON.stringify({ id, type });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  else fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
}

// Une vue par annonce et par session de navigation.
export function TrackView({ id }: { id: string }) {
  useEffect(() => {
    const k = `v:${id}`;
    try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch {}
    send(id, "view");
  }, [id]);
  return null;
}

export function ContactButtons({ id, tel, wa }: { id: string; tel: string; wa?: string }) {
  return (
    <div className="contact-bar" style={wa ? undefined : { gridTemplateColumns: "1fr" }}>
      <a className="btn call" href={tel} onClick={() => send(id, "phone")}>Appeler</a>
      {wa && <a className="btn wa" href={wa} target="_blank" rel="noopener noreferrer" onClick={() => send(id, "whatsapp")}>WhatsApp</a>}
    </div>
  );
}
