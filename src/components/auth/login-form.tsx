"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldAlert } from "lucide-react";
import AuthHeader from "@/components/auth/auth-header";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { setSelectedRole } from "@/store/slices/authSlice";
import { DEMO_ROLES, type Role } from "@/lib/roles";

/** Shared login card. When `role` is provided (per-role demo URL), that role is
 *  pre-selected for the rest of the flow; otherwise the base login is shown with
 *  quick links into each demo persona. */
export default function LoginForm({ role }: { role?: Role }) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Seed the chosen demo role so the whole flow (loading → role-confirm →
  // dashboard) defaults to it.
  useEffect(() => {
    if (role) dispatch(setSelectedRole(role.label));
  }, [role, dispatch]);

  return (
    <div className="min-h-screen bg-[#EBEBEB] flex flex-col font-patrick-hand">
      <header className="flex justify-center pt-8">
        <AuthHeader />
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 w-full max-w-[420px]">
          <h1 className="font-patrick-hand text-[1.65rem] text-center leading-snug mb-1">
            Sign in to your workspace
          </h1>
          <p className="text-sm text-gray-400 text-center mb-6">
            Access your Hitachi HMAX cockpit
          </p>

          {role && (
            <div className="flex justify-center mb-6">
              <span className="text-xs text-gray-600 bg-gray-100 rounded-full px-3 py-1">
                Demo persona · {role.label}
              </span>
            </div>
          )}

          <Button
            onClick={() => router.push("/loading-profile")}
            className="w-full rounded-full h-auto py-3 gap-2 text-sm cursor-pointer"
          >
            <KeyRound size={15} strokeWidth={2} />
            Sign in with Single Sign-On
          </Button>

          <p className="text-sm text-center text-gray-400 mt-4 hover:text-gray-600 cursor-pointer transition-colors">
            Other sign-in options
          </p>

          <hr className="my-6 border-gray-100" />

          {/* Demo persona quick links - only on the base login */}
          {!role && (
            <div className="mb-6">
              <p className="text-xs text-gray-400 text-center mb-2">Jump into a demo persona</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {DEMO_ROLES.map((r) => (
                  <Link
                    key={r.id}
                    href={`/login/${r.id}`}
                    className="text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1 hover:border-gray-400 hover:text-gray-900 transition-colors"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <ShieldAlert size={13} strokeWidth={1.5} />
            <span>Secured by Hitachi IAM Enterprise Guard</span>
          </div>
        </div>
      </main>

      <footer className="flex justify-center items-center gap-4 py-6 text-xs text-gray-400">
        <a href="#" className="hover:underline">Terms of Service</a>
        <span>•</span>
        <a href="#" className="hover:underline">Privacy Policy</a>
        <span>•</span>
        <span>© 2025 Hitachi, Ltd. All rights reserved.</span>
      </footer>
    </div>
  );
}
