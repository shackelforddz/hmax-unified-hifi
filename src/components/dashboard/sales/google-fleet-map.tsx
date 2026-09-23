"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Search as SearchIcon } from "lucide-react";
import WidgetChat, { TRIGGER } from "@/components/dashboard/widget-chat";
import ProgressiveBlur from "@/components/progressive-blur";
import type { MapProps } from "./fleet-map";
import type { MapSearch } from "@/components/dashboard/static-map";

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

export default function GoogleFleetMap({ apiKey, sites, renderTip, overlay, title = "Map view", search }: MapProps & { apiKey: string; title?: string; search?: MapSearch }) {
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
        // Narrow the card on a narrow map so it stays inside the widget.
        const room = (ref.current?.clientWidth ?? 0) - 32;
        node.style.width = `${room > 0 ? Math.min(260, Math.max(180, room)) : 260}px`;
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
          <p className="text-sm text-gray-500">Couldn&apos;t load Google Maps - check the API key.</p>
        </div>
      )}

      {/* Search sits on the map itself, beside the filters */}
      {search && (
        <div className="absolute top-14 right-4 z-10 flex items-center gap-1.5 h-8 w-[200px] px-2.5 bg-white border border-gray-200 rounded-full shadow-sm">
          <input
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder}
            aria-label={`Search the ${title.toLowerCase()}`}
            className="flex-1 min-w-0 text-sm text-gray-700 placeholder-gray-500 outline-none bg-transparent"
          />
          <SearchIcon size={15} strokeWidth={1.5} className="text-gray-500 shrink-0" />
        </div>
      )}

      {overlay}

      {/* Title band - the map blurs and fades out beneath it */}
      <div className="absolute top-0 inset-x-0 z-10 px-4 py-3.5">
        <ProgressiveBlur className="rounded-t-xl" />
        <div className="absolute inset-0 rounded-t-xl bg-gradient-to-b from-[#faf5ed] to-[#faf5ed]/0 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3">
          <h3 className="text-base text-gray-900 shrink-0">{title}</h3>
          <span className="flex-1" />
          <WidgetChat
            title={title}
            triggerClassName={`${TRIGGER} -mt-1 -mr-1`}
          />
        </div>
      </div>
    </div>
  );
}
