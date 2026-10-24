import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Terms of Use" };

export default function Terms() {
  return (
    <>
      <PageHeader
        title="Terms of Use"
        intro="Guidelines, booking policies, and resident service terms at Luxora PG."
      />
      <div className="container-x prose-luxora max-w-3xl py-12">
        <p>
          Information on this site is provided in good faith and may change. Rent, availability, and house rules are confirmed directly with the Luxora PG team at the time of booking.
        </p>
        <p>
          Submitting an inquiry or scheduling a visit does not reserve a room. A room booking is confirmed only upon signing the resident agreement and paying the refundable security deposit.
        </p>
        <p>
          Nearby businesses and metro stations listed on the platform are independent and not operated by Luxora PG.
        </p>
      </div>
    </>
  );
}
