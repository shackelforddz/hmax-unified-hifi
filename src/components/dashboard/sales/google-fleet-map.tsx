"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import WidgetChat from "@/components/dashboard/widget-chat";
import type { MapProps } from "./fleet-map";

const MILAN = { lat: 45.4642, lng: 9.19 };

// Google's default colour tiles, with only the clutter turned down - POI pins,
// business icons and transit lines aren't fleet information.
const BASE_STYLE = [
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

// Load the Google Maps JS API once.
let scriptPromise: Promise<void> | null = null;
function loadGoogleMaps(key: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if ((window as any).google?.maps) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export default function GoogleFleetMap({ apiKey, sites, renderTip, overlay }: MapProps & { apiKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const infoRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const tipRoot = useRef<Root | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // Read at click time, so a tooltip always renders with the latest handlers.
  const renderTipRef = useRef(renderTip);
  useEffect(() => {
    renderTipRef.current = renderTip;
  });

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !ref.current) return;
        const g = (window as any).google;
        mapRef.current = new g.maps.Map(ref.current, {
          center: MILAN,
          zoom: 11,
          styles: BASE_STYLE,
          backgroundColor: "#e5e5e5",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        infoRef.current = new g.maps.InfoWindow();
        setReady(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, [apiKey]);

  // Redraw the pins whenever the filtered set changes.
  useEffect(() => {
    if (!ready) return;
    const g = (window as any).google;
    const map = mapRef.current;
    const info = infoRef.current;
    info.close();
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = sites.map((site) => {
      const marker = new g.maps.Marker({
        position: { lat: site.lat, lng: site.lng },
        map,
        title: site.code,
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          // scale is the radius, so 5 draws a 10px dot.
          scale: 5,
          // A pinging marker is one raising an alert - it reads red.
          fillColor: site.ping ? "#fa000f" : "#171717",
          fillOpacity: 1,
          strokeWeight: 0,
        },
      });
      marker.addListener("click", () => {
        tipRoot.current?.unmount();
        const node = document.createElement("div");
        node.style.width = "260px";
        tipRoot.current = createRoot(node);
        tipRoot.current.render(renderTipRef.current(site));
        info.setContent(node);
        info.open({ map, anchor: marker });
      });
      return marker;
    });
  }, [ready, sites]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 h-full min-h-[420px] bg-gray-100">
      <div ref={ref} className="absolute inset-0" />

      {!ready && !failed && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-gray-400">Couldn&apos;t load Google Maps - check the API key.</p>
        </div>
      )}

      {overlay}

      {/* Chat affordance */}
      <div className="absolute top-4 right-4 z-10">
        <WidgetChat
          title="Fleet map"
          triggerClassName="w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        />
      </div>
    </div>
  );
}
