/**
 * Server-side email sender. Gmail SMTP over STARTTLS.
 *
 * Never import this from a client component — it reads SMTP_PASS, which must
 * stay on the server. Only `app/admin/actions.ts` uses it.
 */
import nodemailer from "nodemailer";
import { site } from "./site.ts";
import { waLink } from "./whatsapp.ts";

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

type Config = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

/**
 * Reads the transport settings. Returns an error rather than throwing, so the
 * admin gets told email is not set up instead of seeing a crash or, worse, a
 * success message for a message that never left.
 */
export function emailConfig():
  | { config: Config; error?: undefined }
  | { config?: undefined; error: string } {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const parsed = Number(process.env.SMTP_PORT ?? 587);
  const port = Number.isFinite(parsed) && parsed > 0 ? parsed : 587;
  const from = process.env.EMAIL_FROM?.trim() || user;

  if (!user || !pass) {
    return {
      error:
        "Email is not configured. Set SMTP_USER and SMTP_PASS in the environment (see .env.local), then try again.",
    };
  }

  return { config: { host, port, user, pass, from: from ?? user } };
}

export const emailConfigured = () => emailConfig().config !== undefined;

/** Turns nodemailer's codes into something an admin can act on. */
function readableError(e: unknown) {
  const err = e as { code?: string; responseCode?: number; message?: string };
  switch (err.code) {
    case "EAUTH":
      return "Gmail rejected the sign-in. SMTP_PASS must be a Google App Password — an ordinary account password will not work, and App Passwords require 2-Step Verification on the account.";
    case "EENVELOPE":
      return "The mail server refused the recipient address. Check the customer's email and try again.";
    case "ECONNECTION":
    case "ETIMEDOUT":
    case "ESOCKET":
      return "Could not reach smtp.gmail.com. Check the network, or that SMTP_PORT is 587 (465 with implicit TLS).";
    default:
      // Never surface the raw error: it can echo the envelope, and in some
      // transports the auth options.
      return err.responseCode
        ? `The mail server refused the message (response ${err.responseCode}).`
        : "The message could not be sent. Check the SMTP settings and try again.";
  }
}

export type SendResult =
  | { ok: true; messageId: string; accepted: string[] }
  | { ok: false; error: string };

/**
 * Sends one message. "ok" means the SMTP server accepted it — not that it
 * reached the customer's inbox.
 *
 * A transport is built per send: this runs on an admin click, a handful of
 * times a day, and a pooled connection would only go stale between them.
 */
export async function sendMail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}): Promise<SendResult> {
  const { config, error } = emailConfig();
  if (!config) return { ok: false, error };

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    // 465 is TLS from the first byte; 587 starts plain and upgrades.
    secure: config.port === 465,
    requireTLS: config.port !== 465,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
  });

  try {
    const info = await transport.sendMail({
      from: `"${site.name}" <${config.from}>`,
      replyTo: config.from,
      to,
      subject,
      html,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    return {
      ok: true,
      messageId: info.messageId,
      accepted: (info.accepted ?? []).map(String),
    };
  } catch (e) {
    return { ok: false, error: readableError(e) };
  } finally {
    transport.close();
  }
}

/* ---------------- fulfilment template ---------------- */

/**
 * Everything the admin typed ends up inside an HTML document that leaves the
 * server, so it is escaped. A password containing `<` would otherwise break the
 * layout at best and inject markup at worst.
 */
const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Admin notes keep their line breaks; everything else is escaped first. */
const multiline = (value: string) => esc(value).replace(/\r?\n/g, "<br>");

export type FulfillmentDetails = {
  reference: string;
  customerName: string;
  items: { title: string; planName: string; meta: string; qty: number }[];
  username: string;
  password?: string;
  duration?: string;
  instructions: string;
  notes?: string;
  attachmentCount: number;
};

/**
 * The message the customer receives. Inline styles only — Gmail and Outlook
 * strip <style> blocks and external sheets.
 */
export function fulfillmentEmail(d: FulfillmentDetails) {
  const wa = waLink(`Hello ${site.name}, I need help with order ${d.reference}.`);

  const row = (label: string, value: string, mono = false) => `
    <tr>
      <td style="padding:8px 16px 8px 0;color:#666666;font-size:14px;vertical-align:top;white-space:nowrap">${esc(label)}</td>
      <td style="padding:8px 0;color:#111111;font-size:15px;font-weight:600;${
        mono ? "font-family:Consolas,Monaco,monospace;letter-spacing:0.02em" : ""
      }">${value}</td>
    </tr>`;

  const credentials = [
    row("Username", esc(d.username), true),
    d.password ? row("Password", esc(d.password), true) : "",
    d.duration ? row("Valid for", esc(d.duration)) : "",
  ].join("");

  const products = d.items
    .map(
      (i) => `
      <li style="margin-bottom:6px;color:#111111;font-size:15px">
        <strong>${esc(i.title)}</strong> — ${esc(i.planName)}
        ${i.meta ? `<span style="color:#666666">(${esc(i.meta)})</span>` : ""}
        × ${i.qty}
      </li>`,
    )
    .join("");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px 12px;background:#f7f7f7;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:8px">
      <tr>
        <td style="padding:24px;border-bottom:3px solid #e50914">
          <div style="font-size:20px;font-weight:800;color:#111111">${esc(site.name)}</div>
          <div style="font-size:13px;color:#666666">${esc(site.tagline)}</div>
        </td>
      </tr>

      <tr>
        <td style="padding:24px">
          <p style="margin:0 0 16px;font-size:15px;color:#111111">
            Hi ${esc(d.customerName)}, your order is ready.
          </p>

          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#666666;text-transform:uppercase;letter-spacing:0.06em">Order</p>
          <p style="margin:0 0 20px;font-size:15px;color:#111111">
            <strong>${esc(d.reference)}</strong>
          </p>

          <ul style="margin:0 0 24px;padding-left:20px">${products}</ul>

          <div style="padding:16px;border:1px solid #e5e5e5;border-radius:8px;background:#f7f7f7">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#666666;text-transform:uppercase;letter-spacing:0.06em">Your access</p>
            <table role="presentation" style="border-collapse:collapse">${credentials}</table>
          </div>

          ${
            d.instructions
              ? `<p style="margin:24px 0 8px;font-size:13px;font-weight:700;color:#666666;text-transform:uppercase;letter-spacing:0.06em">How to use it</p>
                 <p style="margin:0;font-size:15px;line-height:1.6;color:#111111">${multiline(d.instructions)}</p>`
              : ""
          }

          ${
            d.notes
              ? `<p style="margin:24px 0 8px;font-size:13px;font-weight:700;color:#666666;text-transform:uppercase;letter-spacing:0.06em">Notes</p>
                 <p style="margin:0;font-size:15px;line-height:1.6;color:#111111">${multiline(d.notes)}</p>`
              : ""
          }

          ${
            d.attachmentCount > 0
              ? `<p style="margin:24px 0 0;font-size:14px;color:#666666">${d.attachmentCount} image${
                  d.attachmentCount === 1 ? "" : "s"
                } attached to this email.</p>`
              : ""
          }

          <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#666666">
            Keep these details private. If you change the password, contact us
            first — changes can break the account and the warranty.
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:20px 24px;border-top:1px solid #e5e5e5;background:#f7f7f7">
          <p style="margin:0 0 12px;font-size:14px;color:#111111">Need help? Reply to this email or write to
            <a href="mailto:${esc(site.email)}" style="color:#b20710">${esc(site.email)}</a>.
          </p>
          ${
            wa
              ? `<p style="margin:0 0 12px"><a href="${wa}" style="display:inline-block;padding:10px 18px;background:#25d366;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:6px">Message us on WhatsApp</a></p>`
              : ""
          }
          <p style="margin:0;font-size:12px;color:#666666">
            ${esc(site.name)} · Order ${esc(d.reference)}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, subject: `Your ${site.name} order ${d.reference} — access details` };
}
