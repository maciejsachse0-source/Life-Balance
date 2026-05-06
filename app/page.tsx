"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";

export default function Home() {
  const router = useRouter();
  const hydrated = useHydrated();
  const onboardingCompleted = useStore((s) => s.settings.onboardingCompleted);

  useEffect(() => {
    if (!hydrated) return;
    if (!onboardingCompleted) router.replace("/onboarding");
    else router.replace("/dashboard");
  }, [hydrated, onboardingCompleted, router]);

  return <Spinner />;
}
