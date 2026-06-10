import { PageHeader } from "@/components/page-header";
import { BetsForm } from "@/components/bets-form";

export default function BetsPage() {
  return (
    <div>
      <PageHeader
        title="Best Bets — 12:00 PM CT"
        description="Submit your 5 picks. We find the best odds, write a funny script with last night's recap, and email it to Collin to present."
      />
      <BetsForm />
    </div>
  );
}
