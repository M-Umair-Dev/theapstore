import { PaymentMethodsProvider } from "@/components/PaymentMethodsContext";
import { resolvePaymentLogos } from "@/lib/payment-logos";
import { availablePaymentMethods } from "@/lib/repo";

export const dynamic = "force-dynamic";

/**
 * Loads the payment options and their logo paths on the server and hands them
 * to the checkout page. The page itself is a client component, so it can reach
 * neither Mongo nor the filesystem — and `availablePaymentMethods` only ever
 * returns methods an admin left both enabled and visible.
 */
export default async function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const methods = await availablePaymentMethods();

  return (
    <PaymentMethodsProvider methods={methods} logos={resolvePaymentLogos()}>
      {children}
    </PaymentMethodsProvider>
  );
}
