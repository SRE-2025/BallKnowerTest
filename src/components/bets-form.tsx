"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitBets } from "@/app/shows/actions";
import type { PricedBet } from "@/lib/odds";

interface Row {
  matchup: string;
  pick: string;
  market: string;
  line: string;
}
const empty = (): Row => ({ matchup: "", pick: "", market: "moneyline", line: "" });

export function BetsForm() {
  const [recap, setRecap] = React.useState("");
  const [rows, setRows] = React.useState<Row[]>([empty(), empty(), empty(), empty(), empty()]);
  const [busy, setBusy] = React.useState(false);
  const [priced, setPriced] = React.useState<PricedBet[] | null>(null);
  const [script, setScript] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  function set(i: number, key: keyof Row, val: string) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
  }

  async function onSubmit() {
    setBusy(true);
    setMsg(null);
    const res = await submitBets({ recapNote: recap, bets: rows });
    setBusy(false);
    if (res.ok) {
      setPriced(res.priced);
      setScript(res.script);
      setMsg(res.savedTo ? `Emailed ${res.to} (${res.via}). Open the draft email: ${res.savedTo}` : `Sent to ${res.to} via ${res.via}.`);
    } else {
      setMsg(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-5">
          <label className="block text-sm">
            <span className="text-muted-foreground">Last night recap (optional)</span>
            <textarea
              value={recap}
              onChange={(e) => setRecap(e.target.value)}
              rows={2}
              placeholder="How did yesterday's card go?"
              className="mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm"
            />
          </label>

          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <span className="col-span-12 flex items-center text-xs font-semibold text-muted-foreground sm:col-span-1">#{i + 1}</span>
                <input className="col-span-12 rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-sm sm:col-span-4" placeholder="Matchup (e.g. Spurs vs Knicks)" value={row.matchup} onChange={(e) => set(i, "matchup", e.target.value)} />
                <input className="col-span-7 rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-sm sm:col-span-3" placeholder="Pick (e.g. Spurs ML)" value={row.pick} onChange={(e) => set(i, "pick", e.target.value)} />
                <select className="col-span-3 rounded-md border border-border bg-secondary px-2 py-1.5 text-sm sm:col-span-2" value={row.market} onChange={(e) => set(i, "market", e.target.value)}>
                  <option value="moneyline">ML</option>
                  <option value="spread">Spread</option>
                  <option value="total">Total</option>
                  <option value="prop">Prop</option>
                </select>
                <input className="col-span-2 rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-sm sm:col-span-2" placeholder="Line" value={row.line} onChange={(e) => set(i, "line", e.target.value)} />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={onSubmit} disabled={busy}>
              {busy ? "Pricing + writing…" : "Find best odds + send to Collin"}
            </Button>
            {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
          </div>
        </CardContent>
      </Card>

      {priced && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-2">Matchup</th><th className="px-5 py-2">Pick</th><th className="px-5 py-2">Market</th><th className="px-5 py-2">Best odds</th><th className="px-5 py-2">Book</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {priced.map((b, i) => (
                  <tr key={i}>
                    <td className="px-5 py-2">{b.matchup}</td>
                    <td className="px-5 py-2">{b.pick} {b.line}</td>
                    <td className="px-5 py-2"><Badge variant="secondary">{b.market}</Badge></td>
                    <td className="px-5 py-2 font-semibold text-primary">{b.bestOdds}</td>
                    <td className="px-5 py-2 text-muted-foreground">{b.bestBook}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {script && (
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Script (Collin)</h3>
            <pre className="whitespace-pre-wrap text-sm">{script}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
