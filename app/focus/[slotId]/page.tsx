"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { PomodoroMode } from "@/components/focus/PomodoroMode";
import { FlowtimeMode } from "@/components/focus/FlowtimeMode";
import { SimpleMode } from "@/components/focus/SimpleMode";
import { ReflectiveMode } from "@/components/focus/ReflectiveMode";
import { FinishModal } from "@/components/focus/FinishModal";
import { format, startOfWeek } from "date-fns";

export default function FocusPage({ params }: { params: Promise<{ slotId: string }> }) {
  const { slotId } = use(params);
  const router = useRouter();
  const hydrated = useHydrated();
  const slot = useStore((s) => s.calendar.template.slots.find((x) => x.id === slotId));
  const pillars = useStore((s) => s.layers.pillars);
  const goals = useStore((s) => s.goals);
  const physiology = useStore((s) => s.layers.physiology);
  const lifeTaxes = useStore((s) => s.layers.lifeTaxes);
  const toggleSlotCompletion = useStore((s) => s.toggleSlotCompletion);
  const addThought = useStore((s) => s.addThought);

  const [showFinish, setShowFinish] = useState(false);
  const [pendingThought, setPendingThought] = useState<string>("");

  if (!hydrated) return <Spinner />;
  if (!slot) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Slot nie znaleziony.</p>
      </main>
    );
  }

  const pillar = pillars.find((p) => p.id === slot.pillarId);
  const phys = physiology.find((c) => c.id === slot.pillarId);
  const tax = lifeTaxes.find((c) => c.id === slot.pillarId);
  const assignedGoal = slot.goalId ? goals.find((g) => g.id === slot.goalId) : null;
  const title = assignedGoal?.title ?? pillar?.name ?? phys?.name ?? tax?.name ?? "Slot";

  const handleAnswer = (completed: boolean) => {
    const today = new Date();
    const date = format(today, "yyyy-MM-dd");
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    const weekStart = format(monday, "yyyy-MM-dd");
    toggleSlotCompletion(slot.id, weekStart, date, completed);
    if (pendingThought.trim()) {
      addThought({
        text: pendingThought.trim(),
        pillarId: pillar?.id,
        goalId: assignedGoal?.id,
        source: "reflective_focus",
      });
    }
    router.push("/calendar/day");
  };

  const handleFinish = () => setShowFinish(true);
  const handleAbort = () => router.back();
  const handleReflectiveFinish = (text: string) => {
    setPendingThought(text);
    setShowFinish(true);
  };

  // Pomodoro: deep, creative
  if (slot.workType === "deep" || slot.workType === "creative") {
    return (
      <>
        <PomodoroMode
          title={title}
          totalSlotMinutes={slot.durationMinutes}
          onFinish={handleFinish}
          onAbort={handleAbort}
        />
        <FinishModal open={showFinish} onAnswer={handleAnswer} />
      </>
    );
  }

  // Flowtime: shallow, admin
  if (slot.workType === "shallow" || slot.workType === "admin") {
    return (
      <>
        <FlowtimeMode title={title} onFinish={handleFinish} onAbort={handleAbort} />
        <FinishModal open={showFinish} onAnswer={handleAnswer} />
      </>
    );
  }

  // Reflective
  if (slot.workType === "reflective") {
    return (
      <>
        <ReflectiveMode
          title={title}
          defaultMinutes={Math.min(30, Math.max(10, Math.floor(slot.durationMinutes / 2)))}
          onFinishWithThought={handleReflectiveFinish}
          onAbort={handleAbort}
        />
        <FinishModal open={showFinish} onAnswer={handleAnswer} />
      </>
    );
  }

  // Physical (sport)
  if (slot.workType === "physical") {
    return (
      <>
        <FlowtimeMode title={title} onFinish={handleFinish} onAbort={handleAbort} />
        <FinishModal open={showFinish} onAnswer={handleAnswer} />
      </>
    );
  }

  // Social — bądź teraz tutaj
  if (slot.workType === "social") {
    return (
      <>
        <SimpleMode
          title="Bądź teraz tutaj"
          subtitle={title}
          bg="linear-gradient(135deg,#831843,#4a044e)"
          onFinish={handleFinish}
          onAbort={handleAbort}
        />
        <FinishModal open={showFinish} onAnswer={handleAnswer} />
      </>
    );
  }

  // Routine fizjologii / buffer
  return (
    <>
      <SimpleMode
        title={title}
        subtitle={slot.workType === "buffer" ? "Wolny czas — ciesz się" : "Rutyna"}
        onFinish={handleFinish}
        onAbort={handleAbort}
      />
      <FinishModal open={showFinish} onAnswer={handleAnswer} />
    </>
  );
}
