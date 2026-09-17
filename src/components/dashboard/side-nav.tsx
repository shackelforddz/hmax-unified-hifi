"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bell, Search, LayoutGrid, Briefcase, Banknote, Cog, Activity, Stethoscope, LogOut, Check } from "lucide-react";
import { MOCK_USER } from "@/lib/roles";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedRole } from "@/store/slices/authSlice";

const PERSONAS = [
  { label: "Project Manager", icon: Briefcase },
  { label: "Sales", icon: Banknote },
  { label: "Operations", icon: Cog },
  { label: "Reliability Engineer", icon: Activity },
  { label: "Diagnostics", icon: Stethoscope },
] as const;

function NavButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      className="size-8 rounded-full bg-secondary flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
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
    <nav className="w-20 shrink-0 flex flex-col items-center justify-between p-6">
      {/* Wordmark, set vertically up the rail */}
      <div className="relative flex h-16 w-3.5 items-center justify-center shrink-0">
        {/* flex-none keeps the 64x14 wordmark from being squeezed by the rail */}
        <div className="flex-none rotate-90">
          <div className="relative h-3.5 w-16">
            <Image src="/hmax-logo.svg" alt="HMAX" width={64} height={14} priority className="block w-16 h-3.5" />
          </div>
        </div>
      </div>

      {/* Utilities + account */}
      <div className="flex flex-col gap-4 items-center shrink-0">
        <NavButton label="Notifications">
          <span className="relative flex items-center justify-center">
            <Bell size={16} strokeWidth={1.5} />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-gray-900" />
          </span>
        </NavButton>
        <NavButton label="Search">
          <Search size={16} strokeWidth={1.5} />
        </NavButton>
        <NavButton label="Apps">
          <LayoutGrid size={16} strokeWidth={1.5} />
        </NavButton>

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
                  <p className="text-xs text-gray-400 truncate">{MOCK_USER.email}</p>
                </div>
              </div>

              <div className="px-4 pt-2.5 pb-1">
                <p className="text-[11px] text-gray-400 tracking-wider">Persona</p>
              </div>
              {PERSONAS.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => switchPersona(label)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Icon size={15} strokeWidth={1.5} className="text-gray-400" />
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
                <LogOut size={15} strokeWidth={1.5} className="text-gray-400" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
