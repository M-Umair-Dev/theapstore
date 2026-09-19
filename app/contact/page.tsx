"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";
import { waEnabled, waLink } from "@/lib/whatsapp";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const whatsapp = waLink(`Hello ${site.name}, I have a question about an order.`);

  return (
    <>
      <div className="container" style={{ paddingTop: "var(--space-6)" }}>
        <h1 className="section-title">Contact</h1>
        <p className="section-lead">
          Questions before an order, or a warranty claim after one — both start
          here.
        </p>
      </div>

      <div className="container cart-layout">
        <div>
          {sent ? (
            <div className="empty-state">
              <h2>Message sent</h2>
              <p>
                Thanks — we have your message and will reply to the address you
                gave us, usually within a few hours during business hours.
              </p>
              <Link href="/shop" className="btn btn-primary">
                Back to the shop
              </Link>
            </div>
          ) : (
            <form
              id="contact-form"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="form-grid">
                <div className="field">
                  <label className="label" htmlFor="c-name">
                    Name
                  </label>
                  <input id="c-name" className="input" required />
                </div>
                <div className="field">
                  <label className="label" htmlFor="c-email">
                    Email
                  </label>
                  <input id="c-email" type="email" className="input" required />
                </div>
                <div className="field field-full">
                  <label className="label" htmlFor="c-subject">
                    Subject
                  </label>
                  <select id="c-subject" className="select" required>
                    <option value="">Choose a subject</option>
                    <option>Question before ordering</option>
                    <option>Warranty or replacement claim</option>
                    <option>Order status</option>
                    <option>Something else</option>
                  </select>
                </div>
                <div className="field field-full">
                  <label className="label" htmlFor="c-message">
                    Message
                  </label>
                  <textarea id="c-message" className="textarea" required />
                </div>
              </div>

              <div style={{ marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary">
                  Send message
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="summary-card">
          <h2 style={{ fontSize: 16, marginBottom: "var(--space-3)" }}>
            Reach us directly
          </h2>
          <div className="summary-row">
            <span>Email</span>
            <a href={`mailto:${site.email}`} style={{ color: "var(--primary)" }}>
              {site.email}
            </a>
          </div>
          {waEnabled && whatsapp && (
            <div className="summary-row">
              <span>WhatsApp</span>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary)" }}
              >
                Send a message
              </a>
            </div>
          )}
          <div className="summary-row">
            <span>Hours</span>
            <span>Mon–Sat, 10:00–22:00</span>
          </div>
          <p className="helper-text">
            For a warranty claim, include your order reference and the email you
            ordered with. It gets resolved faster.
          </p>
        </aside>
      </div>
    </>
  );
}
