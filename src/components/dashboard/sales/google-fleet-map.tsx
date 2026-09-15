"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { MAP_MARKERS, ASSET_DETAILS } from "@/lib/sales-data";
import WidgetChat from "@/components/dashboard/widget-chat";
import AssetDrawer from "./asset-drawer";

const MILAN = { lat: 45.4642, lng: 9.19 };

// Neutral greyscale base style (CSS grayscale filter is the safety net).
const GREYSCALE_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#737373" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e0e0e0" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
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

export default function GoogleFleetMap({ apiKey }: { apiKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const openAsset = useRef((id: string) => setDrawerId(id));
  openAsset.current = (id: string) => setDrawerId(id);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !ref.current) return;
        const g = (window as any).google;
        const map = new g.maps.Map(ref.current, {
          center: MILAN,
          zoom: 11,
          styles: GREYSCALE_STYLE,
          backgroundColor: "#e5e5e5",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        const info = new g.maps.InfoWindow();

        MAP_MARKERS.forEach((m) => {
          const asset = ASSET_DETAILS[m.id];
          if (!asset) return;
          const marker = new g.maps.Marker({
            position: { lat: m.lat, lng: m.lng },
            map,
            title: asset.code,
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#171717",
              fillOpacity: 1,
              strokeColor: "#171717",
              strokeOpacity: 0.2,
              strokeWeight: 6,
            },
          });
          marker.addListener("click", () => {
            const statusCls = asset.stats.status === "Critical" ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-500";
            const node = document.createElement("div");
            node.className = "font-patrick-hand";
            node.style.width = "190px";
            node.innerHTML = `
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-sm text-gray-900">${asset.code}</p>
                  <p class="text-xs text-gray-400">${asset.type}</p>
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${statusCls}">${asset.stats.status}</span>
              </div>
              <p class="text-xs text-gray-400 mt-1">${asset.location}</p>
              <div class="flex items-center gap-2 mt-2">
                <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-gray-900 rounded-full" style="width:${asset.stats.healthPct}%"></div></div>
                <span class="text-xs text-gray-500">${asset.stats.healthPct}%</span>
              </div>
              <button class="fleet-view mt-3 w-full text-xs text-gray-700 border border-gray-200 rounded-full py-1.5 cursor-pointer">View details</button>`;
            node.querySelector(".fleet-view")?.addEventListener("click", () => {
              info.close();
              openAsset.current(m.id);
            });
            info.setContent(node);
            info.open({ map, anchor: marker });
          });
        });

        if (!cancelled) setReady(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, [apiKey]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 h-full min-h-[420px] bg-gray-100">
      <AssetDrawer assetId={drawerId} onClose={() => setDrawerId(null)} />

      {/* Map - CSS grayscale keeps it on-brand regardless of tile colours */}
      <div ref={ref} className="absolute inset-0 grayscale" />

      {!ready && !failed && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-gray-400">Couldn&apos;t load Google Maps - check the API key.</p>
        </div>
      )}

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
