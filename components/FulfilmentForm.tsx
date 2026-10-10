"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import {
  buildWhatsAppMessage,
  normalizeWhatsAppNumber,
  whatsappHref,
  type FulfillmentMessageInput,
} from "@/lib/fulfillment";

/**
 * The one fulfilment form. Credentials, instructions and attachments are passed
 * in as children so they keep being rendered on the server; this component only
 * owns the delivery choice and the send button.
 *
 * Email submits the form to the server action. WhatsApp cannot — a server
 * action cannot open a tab — so it builds the message from the fields the admin
 * just filled in and opens the chat with it. Nothing is sent by either path
 * without the admin's click, and the WhatsApp path is only a hand-off.
 */

type Method = "email" | "whatsapp";

const read = (form: HTMLFormElement | null, name: string) => {
  const field = form?.elements.namedItem(name);
  return field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement ||
    field instanceof HTMLSelectElement
    ? field.value.trim()
    : "";
};

function SendButton({ method }: { method: Method }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
      {pending
        ? "Sending…"
        : method === "email"
          ? "Send Account Details via Email"
          : "Open WhatsApp with Account Details"}
    </button>
  );
}

export default function FulfilmentForm({
  id,
  action,
  confirmAction,
  back,
  order,
  children,
}: {
  id: string;
  /** The server action used by the Email path. */
  action: (fd: FormData) => void | Promise<void>;
  /** Records a manual WhatsApp send. Only reachable after the chat was opened. */
  confirmAction: (fd: FormData) => void | Promise<void>;
  back: string;
  order: {
    reference: string;
    customerName: string;
    phone: string;
    items: { title: string; planName: string; meta: string }[];
    storeName: string;
    contactEmail: string;
    countryCode: string;
    /** The customer's own choice at checkout, used only as the initial value. */
    preferred?: Method;
  };
  children: React.ReactNode;
}) {
  const [method, setMethod] = useState<Method>(order.preferred ?? "email");
  const [problem, setProblem] = useState("");
  const [preview, setPreview] = useState("");
  /** Set only when a chat window actually opened, so the record button cannot
   *  stand in for the hand-off. */
  const [opened, setOpened] = useState(false);

  return (
    <>
      <form
        id={id}
        action={action}
        className="admin-form"
        style={{ marginTop: "var(--space-4)" }}
        onSubmit={(e) => {
          if (method === "email") return;

          e.preventDefault();
          setProblem("");

          const form = e.currentTarget;
          const number = normalizeWhatsAppNumber(
            read(form, "phone") || order.phone,
            order.countryCode,
          );

          if (!number.ok) {
            setProblem(number.error);
            return;
          }

          const message = buildWhatsAppMessage({
            customerName: order.customerName,
            reference: order.reference,
            items: order.items,
            username: read(form, "username"),
            password: read(form, "password"),
            duration: read(form, "duration"),
            expiry: read(form, "expiry"),
            instructions: read(form, "instructions"),
            notes: read(form, "notes"),
            storeName: order.storeName,
            contactEmail: order.contactEmail,
          } satisfies FulfillmentMessageInput);

          const files = form.elements.namedItem("attachments");
          const hasFiles =
            files instanceof HTMLInputElement && (files.files?.length ?? 0) > 0;

          setPreview(message);

          if (
            !window.confirm(
              `Open WhatsApp for ${order.customerName} with the account details written out?\n\nThe message contains the account password. It is passed to WhatsApp when the chat opens.\n\nNothing is sent until you press Send inside WhatsApp.${
                hasFiles
                  ? "\n\nThe images you picked are NOT attached — a wa.me link cannot carry files. Attach them in the chat yourself."
                  : ""
              }`,
            )
          ) {
            return;
          }

          const chat = window.open(
            whatsappHref(number.number, message),
            "_blank",
            "noopener,noreferrer",
          );

          if (chat) {
            setOpened(true);
          } else {
            // Pop-up blocked. The message is still on screen to copy.
            setProblem(
              "The chat window was blocked. Allow pop-ups for this site, or copy the message below and send it from WhatsApp yourself.",
            );
          }
        }}
      >
      <fieldset className="delivery-pick">
        <legend>Choose Delivery Method</legend>

        <div className="delivery-options">
          {(
            [
              {
                value: "email" as const,
                name: "Send via Email",
                note: `Goes to ${order.customerName}'s saved address, with any images attached.`,
              },
              {
                value: "whatsapp" as const,
                name: "Send via WhatsApp",
                note: `Opens a chat with ${order.customerName} and types the details in. You press Send.`,
              },
            ] satisfies { value: Method; name: string; note: string }[]
          ).map((option) => (
            <label className="delivery-card" key={option.value}>
              <input
                type="radio"
                name="deliveryChoice"
                value={option.value}
                checked={method === option.value}
                onChange={() => {
                  // Only the choice changes — everything typed stays put.
                  setMethod(option.value);
                  setProblem("");
                }}
              />
              <span>
                <span className="delivery-name">{option.name}</span>
                <span className="delivery-note">{option.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {children}

      {problem && (
        <p className="form-error" role="alert">
          {problem}
        </p>
      )}

      <div className="form-actions">
        <SendButton method={method} />
        <span className="hint">
          {method === "email"
            ? "Sent through Gmail. Success means the mail server accepted it, not that it has reached the inbox."
            : "WhatsApp opens with the message prefilled. Review it there and press Send yourself — this panel will not know it was sent until you record it below."}
        </span>
      </div>

      {method === "whatsapp" && preview && (
        <div className="wa-preview">
          <p className="stat-label">Message preview</p>
          <pre>{preview}</pre>
          <p className="hint">
            Exactly what was typed into the chat box. Only the message text
            carries the credentials — the number is the only other part of the
            URL.
          </p>
        </div>
      )}
      </form>

      {/* Rendered only once a chat window actually opened. Recording a
          delivery is a separate, deliberate act and must never be reachable
          without the hand-off having happened. */}
      {opened && (
        <form
          action={confirmAction}
          className="form-actions"
          style={{ marginTop: "var(--space-4)" }}
        >
          <input type="hidden" name="reference" value={order.reference} />
          <input type="hidden" name="back" value={back} />
          <ConfirmSubmit
            className="btn btn-secondary btn-sm"
            label="I sent it on WhatsApp"
            pendingLabel="Saving…"
            message={`Record that the account details for ${order.reference} were sent to ${order.customerName} on WhatsApp?\n\nThis only writes the fulfilment record. It does not send anything and does not change the order or payment status.`}
          />
          <span className="hint">
            Only press this after you have pressed Send in WhatsApp. This panel
            did not send the message and cannot tell whether you did.
          </span>
        </form>
      )}
    </>
  );
}
