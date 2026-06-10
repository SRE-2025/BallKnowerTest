import { promises as fs } from "fs";
import path from "path";

export interface EmailAttachment {
  filename: string;
  url?: string; // link to the file (e.g. a rendered draft)
  path?: string; // local path on disk
}

export interface EmailMessage {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  ok: boolean;
  via: string;
  id?: string;
  savedTo?: string;
  error?: string;
}

export interface Mailer {
  readonly name: string;
  send(msg: EmailMessage): Promise<EmailResult>;
}

// Real provider: Resend (https://resend.com). Requires RESEND_API_KEY + a
// verified EMAIL_FROM. Sends links to attachments (rendered drafts are URLs).
function createResendMailer(apiKey: string): Mailer {
  return {
    name: "resend",
    async send(msg: EmailMessage): Promise<EmailResult> {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM ?? "BallKnower <noreply@ballknower.example>",
            to: [msg.to],
            subject: msg.subject,
            html: msg.html,
          }),
        });
        const data = (await res.json()) as { id?: string; message?: string };
        if (!res.ok) return { ok: false, via: "resend", error: data.message ?? `HTTP ${res.status}` };
        return { ok: true, via: "resend", id: data.id };
      } catch (e) {
        return { ok: false, via: "resend", error: e instanceof Error ? e.message : "send failed" };
      }
    },
  };
}

// Fallback: writes the rendered email to public/outbox/ so you can open it in the
// browser and see exactly what would have been sent (subject, script, links).
const outboxMailer: Mailer = {
  name: "outbox",
  async send(msg: EmailMessage): Promise<EmailResult> {
    const dir = path.join(process.cwd(), "public", "outbox");
    await fs.mkdir(dir, { recursive: true });
    const stamp = Date.now();
    const slug = msg.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    const file = `${stamp}-${slug}.html`;
    const attachmentsHtml = (msg.attachments ?? [])
      .map((a) => `<li><a href="${a.url ?? a.path}">${a.filename}</a></li>`)
      .join("");
    const html = `<!doctype html><meta charset="utf-8"><title>${msg.subject}</title>
<body style="font-family:system-ui;max-width:680px;margin:2rem auto;padding:0 1rem">
<p style="color:#888">To: ${msg.toName ?? ""} &lt;${msg.to}&gt;</p>
<h1>${msg.subject}</h1>
${msg.html}
${attachmentsHtml ? `<h3>Attachments</h3><ul>${attachmentsHtml}</ul>` : ""}
</body>`;
    await fs.writeFile(path.join(dir, file), html);
    return { ok: true, via: "outbox", savedTo: `/outbox/${file}` };
  },
};

export function getMailer(): Mailer {
  const key = process.env.RESEND_API_KEY;
  return key ? createResendMailer(key) : outboxMailer;
}
