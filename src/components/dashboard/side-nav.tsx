"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bell, Search, LayoutGrid, Briefcase, Banknote, Cog, Activity, Stethoscope, LogOut, Check, ExternalLink } from "lucide-react";
import { MOCK_USER } from "@/lib/roles";
import { EXTERNAL_PRODUCTS } from "@/lib/external-products";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedRole } from "@/store/slices/authSlice";

const PERSONAS = [
  { label: "Project Manager", icon: Briefcase },
  { label: "Sales", icon: Banknote },
  { label: "Operations", icon: Cog },
  { label: "Reliability Engineer", icon: Activity },
  { label: "Diagnostics", icon: Stethoscope },
] as const;

function NavButton({
  label,
  onClick,
  expanded,
  children,
}: {
  label: string;
  onClick?: () => void;
  expanded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      title={label}
      className={`size-8 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer shrink-0 ${
        expanded ? "bg-gray-200 text-gray-900" : "bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

export default function SideNav() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const selectedRole = useAppSelector((s) => s.auth.selectedRole);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [apps, setApps] = useState(false);
  const appsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!apps) return;
    const onClick = (e: MouseEvent) => {
      if (appsRef.current && !appsRef.current.contains(e.target as Node)) setApps(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setApps(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [apps]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const switchPersona = (label: string) => {
    dispatch(setSelectedRole(label));
    setOpen(false);
    router.push("/dashboard");
  };

  return (
    <nav
      // px-2, not px-6: the horizontal wordmark needs the rail's full width
      className="shrink-0 flex flex-col items-center justify-between py-6 px-6"
    >
      {/* Wordmark, read straight across the top of the rail */}
      <div className="flex items-center justify-center shrink-0 pt-6">
        <Image src="/hmax-logo.svg" alt="HMAX" width={64} height={14} priority className="block w-16 h-3.5" />
      </div>

      {/* Utilities + account */}
      <div className="flex flex-col gap-4 items-center shrink-0">
        <NavButton label="Notifications">
          <Bell size={16} strokeWidth={1.5} />
        </NavButton>
        <NavButton label="Search">
          <Search size={16} strokeWidth={1.5} />
        </NavButton>
        {/* The systems HMAX reads from - for when the record itself is wanted */}
        <div className="relative" ref={appsRef}>
          <NavButton label="Connected systems" onClick={() => setApps((o) => !o)} expanded={apps}>
            <LayoutGrid size={16} strokeWidth={1.5} />
          </NavButton>

          {apps && (
            <div className="absolute left-11 bottom-0 w-[288px] max-h-[70vh] overflow-y-auto no-scrollbar bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-pop-in">
              <div className="px-4 pt-2.5 pb-2">
                <p className="text-[11px] text-gray-500 tracking-wider">Connected systems</p>
                <p className="text-xs text-gray-600 leading-4 mt-1">
                  HMAX reads from these. Open one to work in the record itself.
                </p>
              </div>
              {EXTERNAL_PRODUCTS.map((product) => (
                <button
                  key={product.name}
                  onClick={() => setApps(false)}
                  aria-label={`Open ${product.name}`}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-gray-900">{product.name}</span>
                    {product.sourceOf.length > 0 && (
                      <span className="block text-xs text-gray-600 leading-4 mt-0.5">
                        {product.sourceOf.join(", ")}
                      </span>
                    )}
                  </span>
                  <ExternalLink size={14} strokeWidth={1.5} className="text-gray-500 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Avatar - opens the persona switcher */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Account and persona"
            aria-expanded={open}
            className="size-8 rounded-full overflow-hidden bg-muted hover:opacity-80 transition-opacity cursor-pointer block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MOCK_USER.avatar} alt={MOCK_USER.fullName} className="size-8 rounded-full object-cover" />
          </button>

          {open && (
            <div className="absolute left-11 bottom-0 w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-pop-in">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MOCK_USER.avatar} alt="" aria-hidden className="w-9 h-9 rounded-full object-cover bg-gray-200 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 truncate">{MOCK_USER.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{MOCK_USER.email}</p>
                </div>
              </div>

              <div className="px-4 pt-2.5 pb-1">
                <p className="text-[11px] text-gray-500 tracking-wider">Persona</p>
              </div>
              {PERSONAS.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => switchPersona(label)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Icon size={15} strokeWidth={1.5} className="text-gray-500" />
                  {label}
                  {selectedRole === label && <Check size={14} className="text-gray-500 ml-auto" />}
                </button>
              ))}

              <hr className="border-gray-100 my-1" />

              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/login");
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <LogOut size={15} strokeWidth={1.5} className="text-gray-500" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
