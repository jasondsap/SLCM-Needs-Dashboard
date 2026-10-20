import type { Metadata } from "next";
import SLCMBudgetPreview from "@/components/SLCMBudgetPreview";

// Design preview of the proposed Budget Tracker restyle. Unlisted and
// noindex; reads the same live sheet as /budget.
export const metadata: Metadata = {
  title: "Budget Tracker · Design Preview",
  robots: { index: false, follow: false },
};

export default function BudgetPreviewPage() {
  return <SLCMBudgetPreview />;
}
