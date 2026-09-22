"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import AuthHeader from "@/components/auth/auth-header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import { MOCK_USER } from "@/lib/roles";

export default function LoadingProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const selectedRole = useAppSelector((s) => s.auth.selectedRole);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    dispatch(setUser({ name: MOCK_USER.fullName, email: MOCK_USER.email }));

    const ANIMATION_DELAY = 150;
    const ANIMATION_DURATION = 6000;

    const startAnim = setTimeout(() => setProgress(100), ANIMATION_DELAY);
    const nav = setTimeout(
      () => router.push("/role-confirm"),
      ANIMATION_DELAY + ANIMATION_DURATION + 400
    );

    return () => {
      clearTimeout(startAnim);
      clearTimeout(nav);
    };
  }, [dispatch, router]);

  return (
    <div className="min-h-screen bg-[#EBEBEB] flex flex-col">
      <header className="flex justify-center pt-8">
        <AuthHeader />
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 w-full max-w-[480px]">
          {/* Avatar */}
          <div className="flex justify-center mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MOCK_USER.avatar}
              alt={MOCK_USER.fullName}
              className="w-14 h-14 rounded-full object-cover bg-gray-200 select-none"
            />
          </div>

          <h1 className=" text-[1.6rem] text-center mb-1">
            Welcome, {MOCK_USER.name}
          </h1>
          <p className="text-sm text-gray-500 text-center mb-7">
            {MOCK_USER.email}
          </p>

          {/* SSO confirmed notice */}
          <div className="bg-gray-50 rounded-xl px-4 py-4 mb-7">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={15} strokeWidth={1.5} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-800">
                Hitachi Identity SSO Authenticated
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed pl-[23px]">
              We've detected your role and prepared a personalized workspace.
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-chart-line rounded-full transition-all duration-[6000ms] ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Configuring {selectedRole} view modules...
            </p>
          </div>
        </div>
      </main>

      <footer className="flex justify-center py-6">
        <p className="text-xs text-gray-500">
          Auto-advancing to workspace customization...
        </p>
      </footer>
    </div>
  );
}
