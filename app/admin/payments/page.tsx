import Link from "next/link";
import { savePaymentSettingsAction } from "@/app/admin/actions";
import {
  looksLikeDemo,
  paymentCatalogue,
  paymentMethodIds,
} from "@/lib/payments";
import { getPaymentSettings } from "@/lib/repo";

export const dynamic = "force-dynamic";

type Params = { saved?: string; error?: string };

export default async function AdminPayments({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const [sp, { methods }] = await Promise.all([
    searchParams,
    getPaymentSettings(),
  ]);

  const anyDemo = methods.some(looksLikeDemo);

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Payment Method Settings</h1>
          <p>
            The accounts customers pay into. A method reaches checkout only when
            it is both enabled and visible.
          </p>
        </div>
      </div>

      {sp.saved && (
        <p className="form-success" style={{ marginBottom: "var(--space-5)" }}>
          Payment settings saved.
        </p>
      )}
      {sp.error && (
        <p className="form-error" role="alert" style={{ marginBottom: "var(--space-5)" }}>
          {sp.error}
        </p>
      )}

      {anyDemo && (
        <p className="form-error" role="alert" style={{ marginBottom: "var(--space-5)" }}>
          Some of these are still demo placeholders. They are shown to customers
          at checkout — replace them with your real account details before taking
          live payments.
        </p>
      )}

      <form action={savePaymentSettingsAction} className="admin-form">
        {paymentMethodIds.map((id) => {
          const method = methods.find((m) => m.id === id) ?? {
            id,
            accountTitle: "",
            accountNumber: "",
            enabled: false,
            visible: false,
          };
          const isBank = id === "bank_transfer";
          const isCrypto = id === "crypto";

          return (
            <div className="admin-panel" key={id}>
              <div className="repeat-head">
                <h2 style={{ marginBottom: 0 }}>
                  {paymentCatalogue[id].label}
                </h2>
                <span className="head-pills">
                  {looksLikeDemo(method) && (
                    <span className="pill pill-off">Demo details</span>
                  )}
                  <span
                    className={`pill${method.enabled ? " pill-ok" : " pill-off"}`}
                  >
                    {method.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span
                    className={`pill${method.visible ? " pill-ok" : " pill-off"}`}
                  >
                    {method.visible ? "Visible" : "Hidden"}
                  </span>
                </span>
              </div>

              <div className="form-row" style={{ marginTop: "var(--space-5)" }}>
                {isBank && (
                  <div className="field">
                    <label className="label" htmlFor={`bankName:${id}`}>
                      Bank Name
                    </label>
                    <input
                      id={`bankName:${id}`}
                      name={`bankName:${id}`}
                      className="input"
                      defaultValue={method.bankName ?? ""}
                      placeholder="Meezan Bank"
                    />
                  </div>
                )}

                <div className="field">
                  <label className="label" htmlFor={`title:${id}`}>
                    Account Title
                  </label>
                  <input
                    id={`title:${id}`}
                    name={`title:${id}`}
                    className="input"
                    defaultValue={method.accountTitle}
                    placeholder="The name the account is registered to"
                  />
                </div>

                <div className="field">
                  <label className="label" htmlFor={`number:${id}`}>
                    {isBank
                      ? "Account Number"
                      : isCrypto
                        ? "Wallet Address"
                        : "Mobile / Account Number"}
                  </label>
                  <input
                    id={`number:${id}`}
                    name={`number:${id}`}
                    className="input"
                    defaultValue={method.accountNumber}
                    placeholder={
                      isBank
                        ? "01234567890123"
                        : isCrypto
                          ? "T..."
                          : "0340 4000618"
                    }
                  />
                  {isCrypto && (
                    <span className="hint">
                      The TRC20 address, exactly as your wallet shows it. While
                      this still says REPLACE, the method stays off checkout and
                      cannot be enabled.
                    </span>
                  )}
                </div>

                {isCrypto && (
                  <>
                    <div className="field">
                      <label className="label" htmlFor={`asset:${id}`}>
                        Coin
                      </label>
                      <input
                        id={`asset:${id}`}
                        name={`asset:${id}`}
                        className="input"
                        defaultValue={method.asset ?? ""}
                        placeholder="USDT"
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor={`network:${id}`}>
                        Network
                      </label>
                      <input
                        id={`network:${id}`}
                        name={`network:${id}`}
                        className="input"
                        defaultValue={method.network ?? ""}
                        placeholder="TRC20 (TRON)"
                      />
                      <span className="hint">
                        Shown to the customer beside the coin. USDT on TRC20 is
                        not the same wallet as USDT on ERC20, so both must be
                        right.
                      </span>
                    </div>
                  </>
                )}

                {isBank && (
                  <>
                    <div className="field">
                      <label className="label" htmlFor={`iban:${id}`}>
                        IBAN
                      </label>
                      <input
                        id={`iban:${id}`}
                        name={`iban:${id}`}
                        className="input"
                        defaultValue={method.iban ?? ""}
                        placeholder="PK00ABCD0000000000000000"
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor={`branch:${id}`}>
                        Branch (Optional)
                      </label>
                      <input
                        id={`branch:${id}`}
                        name={`branch:${id}`}
                        className="input"
                        defaultValue={method.branch ?? ""}
                      />
                    </div>
                  </>
                )}

                <div className="field field-full">
                  <label className="label" htmlFor={`instructions:${id}`}>
                    Payment Instructions (Optional)
                  </label>
                  <textarea
                    id={`instructions:${id}`}
                    name={`instructions:${id}`}
                    className="textarea"
                    defaultValue={method.instructions ?? ""}
                    placeholder="Send the exact total, then upload the screenshot at checkout."
                  />
                </div>
              </div>

              <div className="check-row" style={{ marginTop: "var(--space-4)" }}>
                <label className="check">
                  <input
                    type="checkbox"
                    name={`enabled:${id}`}
                    defaultChecked={method.enabled}
                  />
                  Enabled — customers can choose it
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    name={`visible:${id}`}
                    defaultChecked={method.visible}
                  />
                  Visible — shown at checkout
                </label>
              </div>

              <p className="hint" style={{ marginTop: "var(--space-4)" }}>
                Turning both off keeps the details saved but removes the method
                from checkout. Nothing is deleted.
              </p>
            </div>
          );
        })}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save Payment Methods
          </button>
          <Link href="/order" className="link-btn" target="_blank">
            Preview Checkout
          </Link>
        </div>
      </form>
    </>
  );
}
