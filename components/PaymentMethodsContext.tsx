"use client";

import { createContext, useContext } from "react";
import type { PaymentMethodConfig } from "@/lib/payments";

/**
 * Carries the checkout's payment options from the server layout to the client
 * page. The page has to be a client component because the cart lives in
 * localStorage, and a client page cannot read the database or the filesystem
 * itself — so the logos arrive resolved to a path, or null.
 */
type PaymentContextValue = {
  methods: PaymentMethodConfig[];
  logos: Record<string, string | null>;
};

const PaymentMethodsContext = createContext<PaymentContextValue>({
  methods: [],
  logos: {},
});

export function PaymentMethodsProvider({
  methods,
  logos,
  children,
}: PaymentContextValue & { children: React.ReactNode }) {
  return (
    <PaymentMethodsContext.Provider value={{ methods, logos }}>
      {children}
    </PaymentMethodsContext.Provider>
  );
}

export const usePaymentMethods = () => useContext(PaymentMethodsContext);
