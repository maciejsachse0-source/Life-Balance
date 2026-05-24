// Domain types — see CLAUDE.md section 15

export type WorkType =
  | "deep"
  | "shallow"
  | "creative"
  | "admin"
  | "physical"
  | "social"
  | "reflective"
  | "routine"
  | "buffer";

export type GoalCharacter = "Project" | "Routine" | "Mixed";
export type GoalStatus = "Active" | "Paused" | "Done" | "Abandoned";
export type TaskStatus = "Todo" | "InProgress" | "Done";
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = niedziela
export type DayShort = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type CalendarView = "month" | "week" | "day";
export type GoalView = "tree" | "kanban" | "roadmap";
export type BalanceMode = "calendar_month" | "rolling_30";
export type ThoughtSource = "manual" | "reflective_focus" | "sunday_ritual";

// === Layers ===

export type LayerCategory = {
  id: string;
  name: string;
  hoursPerWeek: number;
  healthyMin?: number;
  warning?: string;
};

export type Pillar = {
  id: string;
  name: string;
  description?: string;
  icon: string; // lucide-react icon name
  color: string; // hex
  weight: number; // 1-10
  vision?: string;
  mission?: string;
  healthyMin?: number; // h/week
};

export type Layers = {
  physiology: LayerCategory[];
  lifeTaxes: LayerCategory[];
  pillars: Pillar[];
};

// === Goals ===

export type RoutineConfig = {
  frequency: "daily" | "weekly" | "custom";
  timesPerWeek?: number;
  customDays?: DayShort[];
  durationMinutes: number;
  workType: WorkType;
  completions: RoutineCompletion[];
};

export type RoutineCompletion = {
  id: string;
  date: string; // ISO date
  completed: boolean;
};

export type Task = {
  id: string;
  goalId: string;
  milestoneId: string;
  title: string;
  status: TaskStatus;
  workType: WorkType;
  deadline?: string; // ISO
  notes?: string;
  subtasks?: Task[];
  createdAt: string;
  completedAt?: string;
  manualReassignCount: number;
};

export type Milestone = {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  deadline?: string;
  order: number;
  // Mixed only:
  character?: "Project" | "Routine";
  // Project milestone:
  tasks?: Task[];
  // Routine milestone:
  routineConfig?: RoutineConfig;
};

export type Goal = {
  id: string;
  pillarId: string;
  title: string;
  description?: string;
  vision?: string;
  character: GoalCharacter;
  status: GoalStatus;
  weight?: number;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  milestones?: Milestone[];
  routineConfig?: RoutineConfig;
};

// === Calendar ===

export type Slot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startMinute: number; // 0–1440, step 30
  durationMinutes: number; // step 30
  pillarId: string;
  workType: WorkType;
  taskId?: string;
  goalId?: string;
  isFixed?: boolean;
};

export type WeekTemplate = {
  slots: Slot[];
};

export type WeekOverride = {
  weekStartDate: string; // ISO date — Monday
  slots: Slot[];
};

export type Calendar = {
  template: WeekTemplate;
  weekOverrides: WeekOverride[];
};

export type SlotCompletion = {
  id: string;
  slotId: string;
  weekStartDate: string;
  date: string;
  completed: boolean;
  attemptedAt: string;
};

// === Thoughts ===

export type Thought = {
  id: string;
  text: string;
  createdAt: string;
  pillarId?: string;
  goalId?: string;
  source?: ThoughtSource;
};

// === Settings ===

export type PersonalValue = {
  id: string;
  title: string;
  description?: string;
};

export type Settings = {
  selectedTemplate?: string;
  balanceMode: BalanceMode;
  lastCalendarView: CalendarView;
  lastGoalViewPerGoalId: Record<string, GoalView>;
  changeCounter: number;
  onboardingCompleted: boolean;
  personalMission?: string;
  personalVision?: string;
  dailyIntention?: string;
  personalValues?: PersonalValue[];
};

// === App state root ===

export type AppState = {
  schemaVersion: number;
  settings: Settings;
  layers: Layers;
  goals: Goal[];
  calendar: Calendar;
  slotCompletions: SlotCompletion[];
  thoughts: Thought[];
};
