import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderConfirmationSummary } from "@/components/checkout/order-confirmation-summary";
import { getValidatedOrderConfirmation } from "@/features/checkout/queries";

export const dynamic = "force-dynamic";

type OrderConfirmationParams = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({
  params,
}: OrderConfirmationParams): Promise<Metadata> {
  const { orderNumber } = await params;

  return {
    title: `Order ${orderNumber} | Sinbad Commerce Lab`,
    description: "Cash on Delivery order confirmation.",
  };
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationParams) {
  const [{ orderNumber }, { token }] = await Promise.all([params, searchParams]);
  const order = await getValidatedOrderConfirmation(orderNumber, token);

  if (!order) {
    notFound();
  }

  return <OrderConfirmationSummary order={order} />;
}
