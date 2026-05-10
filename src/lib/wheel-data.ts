export type Outcome = "death" | "money" | "neutral" | "jackpot";

export type Slice = {
  label: string;
  emoji: string;
  color: string; // CSS color (oklch ok)
  outcome: Outcome;
  popup: string;
};

export const SLICES: Slice[] = [
  { emoji: "💀", label: "DEATH", color: "oklch(0.35 0.15 25)", outcome: "death", popup: "💀 YOU MET YOUR FATE 💀" },
  { emoji: "💰", label: "₦500,000", color: "oklch(0.78 0.18 95)", outcome: "money", popup: "💸 YOU GOT RICH 💸" },
  { emoji: "🔥", label: "DOUBLE SPIN", color: "oklch(0.7 0.25 35)", outcome: "neutral", popup: "🔥 SPIN AGAIN! 🔥" },
  { emoji: "😭", label: "CRY 10s", color: "oklch(0.6 0.18 230)", outcome: "neutral", popup: "😭 LET IT OUT 😭" },
  { emoji: "🎉", label: "JACKPOT", color: "oklch(0.78 0.22 145)", outcome: "jackpot", popup: "💸 YOU GOT RICH 💸" },
  { emoji: "💤", label: "SLEEP", color: "oklch(0.55 0.15 280)", outcome: "neutral", popup: "💤 GOODNIGHT 💤" },
  { emoji: "🧠", label: "TRUTH/DARE", color: "oklch(0.7 0.25 305)", outcome: "neutral", popup: "🧠 SPILL THE TEA 🧠" },
  { emoji: "😈", label: "CURSED", color: "oklch(0.45 0.2 320)", outcome: "neutral", popup: "😈 YOU ARE CURSED 😈" },
  { emoji: "🍔", label: "FREE FOOD", color: "oklch(0.78 0.2 60)", outcome: "neutral", popup: "🍔 ENJOY THE FEAST 🍔" },
  { emoji: "💎", label: "LUCKY DAY", color: "oklch(0.82 0.18 195)", outcome: "neutral", popup: "💎 LUCK IS YOURS 💎" },
  { emoji: "📱", label: "CALL CRUSH", color: "oklch(0.75 0.25 0)", outcome: "neutral", popup: "📱 DIAL THEM NOW 📱" },
  { emoji: "👑", label: "KING MODE", color: "oklch(0.7 0.2 85)", outcome: "neutral", popup: "👑 ALL HAIL YOU 👑" },
];
