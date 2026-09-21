"use client";

import { useRouter } from "next/navigation";
import {
  Briefcase,
  Banknote,
  RefreshCcw,
  Cog,
  Stethoscope,
  Check,
  LayoutDashboard,
  MessageSquareText,
  PanelRightOpen,
  CircleCheck,
} from "lucide-react";
import AuthHeader from "@/components/auth/auth-header";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedRole } from "@/store/slices/authSlice";
import {
  RECOMMENDED_ROLE,
  ALL_ROLES,
  MOCK_USER,
  PRODUCT_INTRO,
  ROLE_INTRO,
  HOW_TO_USE,
} from "@/lib/roles";

const ICON_MAP: Record<string, React.ElementType> = {
  Briefcase,
  Banknote,
  RefreshCcw,
  Cog,
  Stethoscope,
  LayoutDashboard,
  MessageSquareText,
  PanelRightOpen,
  CircleCheck,
};

function RoleIcon({ name, size = 22 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} strokeWidth={1.5} />;
}

export default function RoleConfirmPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const selectedRoleLabel = useAppSelector((s) => s.auth.selectedRole);

  // The role carried in from the login URL becomes the recommended role.
  const recommended = ALL_ROLES.find((r) => r.label === selectedRoleLabel) ?? RECOMMENDED_ROLE;
  const intro = ROLE_INTRO[recommended.label];

  const handleContinue = () => {
    dispatch(setSelectedRole(recommended.label));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#EBEBEB] flex flex-col">
      <header className="flex justify-center pt-8">
        <AuthHeader />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[740px]">
          {/* Welcome heading */}
          <h1 className=" text-[2rem] text-center mb-3">
            Welcome to HMAX Unified, {MOCK_USER.name}
          </h1>
          <p className="text-sm text-gray-500 text-center leading-relaxed max-w-[520px] mx-auto mb-8">
            {PRODUCT_INTRO}
          </p>

          {/* Role identified + what they'll see */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-6 mb-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] tracking-wider text-gray-500 mb-3">Role identified</p>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                    <RoleIcon name={recommended.icon} size={20} />
                  </div>
                  <h2 className=" text-xl">{recommended.label}</h2>
                </div>
              </div>
              {intro && (
                <div>
                  <p className="text-[11px] tracking-wider text-gray-500 mb-3">What you&apos;ll see</p>
                  <ul className="flex flex-col gap-2">
                    {intro.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-gray-600 leading-snug">
                        <Check size={14} className="text-gray-500 shrink-0 mt-0.5" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Getting started - a quick primer on using the product */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-6 mb-6">
            <p className="text-[11px] tracking-wider text-gray-500 mb-4">Getting started - four things to try first</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {HOW_TO_USE.map((step, i) => (
                <div key={step.title} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 mt-0.5 relative">
                    <RoleIcon name={step.icon} size={18} />
                    <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-black text-white text-[10px] flex items-center justify-center leading-none">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 mb-1">{step.title}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom actions */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/login")}
              className="h-auto px-0 text-sm text-gray-500 hover:bg-transparent hover:text-gray-800 cursor-pointer"
            >
              Sign in with another account
            </Button>
            <Button
              onClick={handleContinue}
              className="rounded-full h-auto px-6 py-2.5 text-sm cursor-pointer"
            >
              Enter your workspace
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
