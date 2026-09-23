"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import AssetDrawer from "@/components/dashboard/sales/asset-drawer";
import ContractDrawer from "@/components/dashboard/operations/contract-drawer";
import SlaContractDrawer from "@/components/dashboard/sales/sla-contract-drawer";
import OpportunityDrawer from "@/components/dashboard/sales/opportunity-drawer";
import { ConversationLauncherContext, useConversationLauncher, type LaunchFn } from "@/components/dashboard/conversation-launcher";
import { getAssetDetail, resolveAssetId } from "@/lib/asset-lookup";
import { OPPORTUNITIES, leadDetail } from "@/lib/sales-data";
import { resolveContract, type ContractRef } from "@/lib/contract-lookup";
import { useAppSelector } from "@/store/hooks";
import { DUR, EASE, dur, gsap, useGSAP } from "@/lib/motion";

/* ── Stacked detail drawers ──────────────────────────────────────────
   Drilling into an asset, contract or lead from inside a drawer slides its
   detail drawer over the current one, with no dimming. Each close (X,
   Escape or a click beside it) peels back just the top drawer. */

/** Records that can be stacked as a drawer. */
export type DrawerDetail = { kind: "asset"; id: string } | { kind: "lead"; id: string } | ContractRef;
/** Records that can be read as a full page - the drawers, plus the ones that
 *  only ever open from a widget. */
export type Detail =
  | DrawerDetail
  | { kind: "attention"; id: string }
  | { kind: "customer"; id: string }
  | { kind: "work-order"; id: string };
type Layer = { key: number; detail: DrawerDetail; closing: boolean };

interface DetailDrawers {
  openAsset: (assetId: string) => void;
  openContract: (ref: ContractRef) => void;
  openLead: (oppId: string) => void;
  /** How many drawers are stacked right now. Anything that closes on Escape
   *  checks this first, so the top drawer closes before whatever is beneath. */
  count: number;
  /** The record being read as a full page, under its own tab. */
  page: Detail | null;
  /** Leave the drawers behind and open the same record as a page. */
  openPage: (detail: Detail) => void;
  closePage: () => void;
}

const DetailDrawersContext = createContext<DetailDrawers | null>(null);

/* How long a drawer takes to leave, so the layer can be unmounted once it has
   actually gone. The slide itself is owned by useDrawerLayer below. */
const SLIDE_MS = DUR.drawerOut * 1000;
const noopSubscribe = () => () => {};

export function DetailDrawerProvider({ children }: { children: React.ReactNode }) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [page, setPage] = useState<Detail | null>(null);

  // Switching persona lands on a different dashboard, so whatever was open
  // belongs to the one being left. Adjusted during render rather than in an
  // effect, so the new dashboard never paints the old record first.
  const role = useAppSelector((st) => st.auth.selectedRole);
  const [lastRole, setLastRole] = useState(role);
  if (role !== lastRole) {
    setLastRole(role);
    setPage(null);
    setLayers([]);
  }
  const keyRef = useRef(0);
  // Portals need document.body, which only exists once on the client.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const open = useCallback((detail: DrawerDetail) => {
    setLayers((ls) => [...ls, { key: ++keyRef.current, detail, closing: false }]);
  }, []);

  const close = useCallback((key: number) => {
    setLayers((ls) => ls.map((l) => (l.key === key ? { ...l, closing: true } : l)));
    setTimeout(() => setLayers((ls) => ls.filter((l) => l.key !== key)), SLIDE_MS);
  }, []);

  // Escape closes only the top drawer, before any drawer beneath sees it.
  const top = layers.filter((l) => !l.closing).at(-1);
  useEffect(() => {
    if (!top) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      close(top.key);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [top, close]);

  const openCount = layers.filter((l) => !l.closing).length;
  const api = useMemo<DetailDrawers>(
    () => ({
      openAsset: (id) => open({ kind: "asset", id }),
      openContract: (ref) => open(ref),
      openLead: (id) => open({ kind: "lead", id }),
      count: openCount,
      page,
      // The page replaces the drawers rather than sitting under them.
      openPage: (detail) => {
        setLayers([]);
        setPage(detail);
      },
      closePage: () => setPage(null),
    }),
    [open, openCount, page]
  );

  // Starting a conversation from any drawer clears the whole stack, so no
  // stacked drawer is left sitting over the conversation.
  const launch = useConversationLauncher();
  const launchAndClear = useCallback<LaunchFn>(
    (args) => {
      setLayers([]);
      launch(args);
    },
    [launch]
  );

  return (
    <ConversationLauncherContext.Provider value={launchAndClear}>
      <DetailDrawersContext.Provider value={api}>
        {children}
        {mounted &&
          createPortal(
            layers.map((l, i) => <StackedDrawer key={l.key} layer={l} depth={i} onClose={() => close(l.key)} />),
            document.body
          )}
      </DetailDrawersContext.Provider>
    </ConversationLauncherContext.Provider>
  );
}

/* Mounts off-screen, then slides in on the next frame; slides out before
   it is removed. */
function StackedDrawer({ layer, depth, onClose }: { layer: Layer; depth: number; onClose: () => void }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const hidden = !entered || layer.closing;
  const d = layer.detail;
  if (d.kind === "asset") return <AssetDrawer assetId={d.id} onClose={onClose} layer={depth} hidden={hidden} />;
  if (d.kind === "lead") {
    const opp = OPPORTUNITIES.find((o) => o.id === d.id) ?? null;
    return (
      <OpportunityDrawer
        opp={opp}
        detail={opp ? leadDetail(opp) : null}
        onClose={onClose}
        layer={depth}
        hidden={hidden}
      />
    );
  }
  if (d.kind === "ops") return <ContractDrawer contractId={d.id} onClose={onClose} layer={depth} hidden={hidden} />;
  return <SlaContractDrawer contractId={d.id} onClose={onClose} layer={depth} hidden={hidden} />;
}

export const useDetailDrawers = () => useContext(DetailDrawersContext);

/* ── The slide ───────────────────────────────────────────────────────
   Tailwind's shadow-2xl, written out so it can be tweened rather than
   swapped. A closed drawer sits off-screen to the right, where a shadow would
   otherwise smudge the viewport edge, so it fades with the panel. */
const PANEL_OPEN = { xPercent: 0, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" };
const PANEL_SHUT = { xPercent: 100, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0)" };

/** The shell of a drawer: a dimming backdrop and the panel that slides over it.
 *  Base drawers dim the page; stacked ones (`layer` set) sit above them with a
 *  clear click-to-close backdrop.
 *
 *  The slide is a GSAP timeline rather than a CSS transition for one reason:
 *  drilling from one drawer straight into another used to start a second
 *  transition while the first was still running, and the two fought over the
 *  same properties - the panel could settle a few pixels short, or snap. A
 *  timeline with `overwrite: "auto"` retargets whatever is mid-flight from
 *  wherever it has actually got to, so an interrupted drawer resolves cleanly.
 *  Backdrop and panel also share one clock now, instead of two transitions that
 *  happened to be given the same duration. */
export function useDrawerLayer(open: boolean, layer?: number) {
  const backdrop = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  /* What `open` was the last time this ran. A drawer only travels when that
     has actually changed; any other run just asserts the state it should be
     resting in. That covers the first paint - a drawer already closed must not
     animate into being closed, or every page load dims behind a drawer sliding
     away - and it covers React running the effect again without `open` moving,
     which Strict Mode does on every mount: the set below is reverted with the
     discarded first pass, so the second pass has to re-apply it rather than
     tween away from whatever the stylesheet left behind. */
  const was = useRef<boolean | null>(null);

  useGSAP(
    () => {
      const p = panel.current;
      const b = backdrop.current;
      if (!p || !b) return;

      const moved = was.current !== null && was.current !== open;
      was.current = open;
      if (!moved) {
        gsap.set(p, open ? PANEL_OPEN : PANEL_SHUT);
        gsap.set(b, { opacity: open ? 1 : 0 });
        return;
      }

      const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
      if (open) {
        tl.to(p, { ...PANEL_OPEN, duration: dur(DUR.drawerIn), ease: EASE.entrance }, 0)
          // The dim leads very slightly, so the page recedes as the panel arrives.
          .to(b, { opacity: 1, duration: dur(DUR.drawerIn * 0.8), ease: EASE.entrance }, 0);
      } else {
        tl.to(p, { ...PANEL_SHUT, duration: dur(DUR.drawerOut), ease: EASE.exit }, 0)
          .to(b, { opacity: 0, duration: dur(DUR.drawerOut), ease: EASE.exit }, 0);
      }
    },
    { dependencies: [open] }
  );

  const stacked = layer !== undefined;
  const z = stacked ? 55 + layer * 2 : undefined;
  return {
    backdrop: {
      ref: backdrop,
      className: `fixed inset-0 ${stacked ? "" : "z-40 bg-black/20"} ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`,
      style: z !== undefined ? { zIndex: z - 1 } : undefined,
    },
    panel: {
      ref: panel,
      className: `fixed top-0 right-0 bottom-0 ${stacked ? "" : "z-50"} w-[520px] max-w-[92vw] bg-white flex flex-col`,
      style: z !== undefined ? { zIndex: z } : undefined,
    },
  };
}

const LINK_CLS =
  "text-left underline decoration-gray-300 underline-offset-2 hover:decoration-gray-700 hover:text-gray-900 transition-colors cursor-pointer";

/** An asset reference that opens its detail drawer. `asset` is a code or unit
 *  tag ("AST-014", "S-12 - HVDC Converter Transformer"); references that don't
 *  resolve to a known asset render as plain content. */
export function AssetLink({ asset, children, className = "" }: { asset: string; children?: React.ReactNode; className?: string }) {
  const drawers = useDetailDrawers();
  const id = resolveAssetId(asset);
  const content = children ?? asset;
  if (!drawers || !id || !getAssetDetail(id)) return <span className={className}>{content}</span>;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        drawers.openAsset(id);
      }}
      className={`${LINK_CLS} ${className}`}
    >
      {content}
    </button>
  );
}

/** A contract reference that opens its detail drawer. */
export function ContractLink({ contract, customer, children, className = "" }: { contract: string; customer?: string; children?: React.ReactNode; className?: string }) {
  const drawers = useDetailDrawers();
  const ref = resolveContract(contract, customer);
  const content = children ?? contract;
  if (!drawers || !ref) return <span className={className}>{content}</span>;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        drawers.openContract(ref);
      }}
      className={`${LINK_CLS} ${className}`}
    >
      {content}
    </button>
  );
}
