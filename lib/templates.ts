// 6 startup templates — see CLAUDE.md section 2.2
import type { Layers } from "./types";

export type TemplateDef = {
  id: string;
  name: string;
  description: string;
  layers: Omit<Layers, "pillars"> & {
    pillars: Array<Omit<Layers["pillars"][number], "id">>;
  };
};

const PILLAR_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#ef4444", // red
];

export const TEMPLATES: TemplateDef[] = [
  {
    id: "classic-6",
    name: "Klasyczna 6-elementowa",
    description: "Sześć obszarów życia z balansem pracy, zdrowia i relacji.",
    layers: {
      physiology: [
        { id: "phys-sleep", name: "Sen", hoursPerWeek: 56, healthyMin: 49, warning: "Sen poniżej 7h/dobę długoterminowo szkodzi" },
        { id: "phys-food", name: "Jedzenie", hoursPerWeek: 12, healthyMin: 8 },
        { id: "phys-hygiene", name: "Higiena", hoursPerWeek: 5 },
      ],
      lifeTaxes: [
        { id: "tax-logistics", name: "Logistyka", hoursPerWeek: 8 },
        { id: "tax-buffer", name: "Bufor", hoursPerWeek: 13 },
      ],
      pillars: [
        { name: "Praca/Misja", icon: "Briefcase", color: PILLAR_COLORS[0], weight: 4 },
        { name: "Ciało", icon: "Dumbbell", color: PILLAR_COLORS[2], weight: 2, healthyMin: 3 },
        { name: "Umysł", icon: "Brain", color: PILLAR_COLORS[3], weight: 1.5 },
        { name: "Relacje", icon: "Users", color: PILLAR_COLORS[1], weight: 1.5 },
        { name: "Ja", icon: "User", color: PILLAR_COLORS[4], weight: 0.5 },
        { name: "Finanse", icon: "Wallet", color: PILLAR_COLORS[5], weight: 0.5 },
      ],
    },
  },
  {
    id: "founder",
    name: "Founder/Przedsiębiorca",
    description: "Dla osoby budującej własną firmę — większy nacisk na sprzedaż i produkt.",
    layers: {
      physiology: [
        { id: "phys-sleep", name: "Sen", hoursPerWeek: 49, healthyMin: 49 },
        { id: "phys-food", name: "Jedzenie", hoursPerWeek: 10 },
        { id: "phys-hygiene", name: "Higiena", hoursPerWeek: 4 },
      ],
      lifeTaxes: [
        { id: "tax-logistics", name: "Logistyka", hoursPerWeek: 6 },
        { id: "tax-buffer", name: "Bufor", hoursPerWeek: 10 },
      ],
      pillars: [
        { name: "Firma/Misja", icon: "Rocket", color: PILLAR_COLORS[0], weight: 5 },
        { name: "Sprzedaż", icon: "TrendingUp", color: PILLAR_COLORS[3], weight: 3 },
        { name: "Produkt", icon: "Cog", color: PILLAR_COLORS[5], weight: 3 },
        { name: "Ciało", icon: "Dumbbell", color: PILLAR_COLORS[2], weight: 2, healthyMin: 3 },
        { name: "Relacje", icon: "Users", color: PILLAR_COLORS[1], weight: 1 },
        { name: "Ja", icon: "User", color: PILLAR_COLORS[4], weight: 1 },
      ],
    },
  },
  {
    id: "student",
    name: "Student/Naukowiec",
    description: "Studia jako główna oś, miejsce na pasję i wzajemne relacje.",
    layers: {
      physiology: [
        { id: "phys-sleep", name: "Sen", hoursPerWeek: 56, healthyMin: 49 },
        { id: "phys-food", name: "Jedzenie", hoursPerWeek: 12 },
        { id: "phys-hygiene", name: "Higiena", hoursPerWeek: 5 },
      ],
      lifeTaxes: [
        { id: "tax-logistics", name: "Logistyka", hoursPerWeek: 8 },
        { id: "tax-buffer", name: "Bufor", hoursPerWeek: 13 },
      ],
      pillars: [
        { name: "Studia", icon: "GraduationCap", color: PILLAR_COLORS[0], weight: 4 },
        { name: "Ciało", icon: "Dumbbell", color: PILLAR_COLORS[2], weight: 2, healthyMin: 3 },
        { name: "Relacje", icon: "Users", color: PILLAR_COLORS[1], weight: 2 },
        { name: "Hobby/Pasja", icon: "Sparkles", color: PILLAR_COLORS[3], weight: 1.5 },
        { name: "Ja", icon: "User", color: PILLAR_COLORS[4], weight: 1 },
        { name: "Finanse", icon: "Wallet", color: PILLAR_COLORS[5], weight: 0.5 },
      ],
    },
  },
  {
    id: "parent",
    name: "Rodzic",
    description: "Dla rodzica — rodzina i dom z wagą równą lub większą niż praca.",
    layers: {
      physiology: [
        { id: "phys-sleep", name: "Sen", hoursPerWeek: 56, healthyMin: 49 },
        { id: "phys-food", name: "Jedzenie", hoursPerWeek: 14 },
        { id: "phys-hygiene", name: "Higiena", hoursPerWeek: 5 },
      ],
      lifeTaxes: [
        { id: "tax-logistics", name: "Logistyka", hoursPerWeek: 12 },
        { id: "tax-buffer", name: "Bufor", hoursPerWeek: 12 },
      ],
      pillars: [
        { name: "Praca", icon: "Briefcase", color: PILLAR_COLORS[0], weight: 3 },
        { name: "Rodzina", icon: "Heart", color: PILLAR_COLORS[1], weight: 4 },
        { name: "Ciało", icon: "Dumbbell", color: PILLAR_COLORS[2], weight: 1.5, healthyMin: 3 },
        { name: "Ja", icon: "User", color: PILLAR_COLORS[4], weight: 1 },
        { name: "Społeczność", icon: "Users", color: PILLAR_COLORS[3], weight: 0.5 },
        { name: "Dom", icon: "Home", color: PILLAR_COLORS[5], weight: 1 },
      ],
    },
  },
  {
    id: "minimal-4",
    name: "Minimalistyczna 4-elementowa",
    description: "Cztery obszary, bez rozdrabniania. Dla wyznawców prostoty.",
    layers: {
      physiology: [
        { id: "phys-sleep", name: "Sen", hoursPerWeek: 56, healthyMin: 49 },
        { id: "phys-food", name: "Jedzenie", hoursPerWeek: 12 },
        { id: "phys-hygiene", name: "Higiena", hoursPerWeek: 5 },
      ],
      lifeTaxes: [
        { id: "tax-logistics", name: "Logistyka", hoursPerWeek: 8 },
        { id: "tax-buffer", name: "Bufor", hoursPerWeek: 13 },
      ],
      pillars: [
        { name: "Praca", icon: "Briefcase", color: PILLAR_COLORS[0], weight: 4 },
        { name: "Zdrowie", icon: "HeartPulse", color: PILLAR_COLORS[2], weight: 3, healthyMin: 5 },
        { name: "Ludzie", icon: "Users", color: PILLAR_COLORS[1], weight: 2 },
        { name: "Ja", icon: "User", color: PILLAR_COLORS[4], weight: 1 },
      ],
    },
  },
  {
    id: "blank",
    name: "Custom od zera",
    description: "Pusta plansza. Sam dodajesz wszystkie filary.",
    layers: {
      physiology: [
        { id: "phys-sleep", name: "Sen", hoursPerWeek: 56, healthyMin: 49 },
        { id: "phys-food", name: "Jedzenie", hoursPerWeek: 12 },
        { id: "phys-hygiene", name: "Higiena", hoursPerWeek: 5 },
      ],
      lifeTaxes: [
        { id: "tax-logistics", name: "Logistyka", hoursPerWeek: 8 },
        { id: "tax-buffer", name: "Bufor", hoursPerWeek: 13 },
      ],
      pillars: [],
    },
  },
];

export const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id);
