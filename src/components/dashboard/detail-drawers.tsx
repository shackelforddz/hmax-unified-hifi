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

const SLIDE_MS = 500;
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

/* A drawer that is already closed on its first paint must not animate into
   that state: the browser resolves `translate` from nothing to 100% and runs
   the transition, which reads as a drawer opening and sliding away on every
   page load. Transitions are withheld until after that first frame - by the
   time one is opened, itself a re-render, they are back. */
let animationsReady = false;
if (typeof window !== "undefined") requestAnimationFrame(() => (animationsReady = true));

/** Classes and z-index for a drawer: base drawers dim the page, stacked
 *  ones (`layer` set) sit above them with a clear click-to-close backdrop. */
export function drawerLayer(open: boolean, layer?: number) {
  const stacked = layer !== undefined;
  const z = stacked ? 55 + layer * 2 : undefined;
  const settle = animationsReady ? "" : "transition-none";
  return {
    backdrop: {
      className: `fixed inset-0 ${stacked ? "" : "z-40 bg-black/20"} transition-opacity duration-300 ${settle} ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`,
      style: z !== undefined ? { zIndex: z - 1 } : undefined,
    },
    panel: {
      className: `fixed top-0 right-0 bottom-0 ${stacked ? "" : "z-50"} w-[520px] max-w-[92vw] bg-white flex flex-col transition-[translate,box-shadow] duration-500 ease-in-out ${settle} ${
        open ? "translate-x-0 shadow-2xl" : "translate-x-full shadow-none"
      }`,
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
