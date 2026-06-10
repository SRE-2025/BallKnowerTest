// Talent who receive the compiled video + script by email. Addresses are
// env-configurable; defaults are placeholders so the flow runs without setup.
export interface Recipient {
  key: "marcus" | "collin";
  name: string;
  role: string;
  email: string;
}

export const RECIPIENTS: Record<"marcus" | "collin", Recipient> = {
  marcus: {
    key: "marcus",
    name: "Marcus",
    role: "On-camera talent — Top 7 & shows",
    email: process.env.MARCUS_EMAIL ?? "marcus@ballknower.example",
  },
  collin: {
    key: "collin",
    name: "Collin",
    role: "Best Bets presenter",
    email: process.env.COLLIN_EMAIL ?? "collin@ballknower.example",
  },
};
