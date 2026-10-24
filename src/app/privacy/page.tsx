import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        intro="How Luxora PG securely collects, manages, and safeguards resident data."
      />
      <div className="container-x prose-luxora max-w-3xl py-12">
        <p>
          <strong className="text-ink">What we collect.</strong> Your name, mobile number, preferred property or area, room preference, dates, and any message you choose to send, strictly when you submit an inquiry or visit request form.
        </p>
        <p>
          <strong className="text-ink">Why.</strong> To respond to your room inquiry, arrange a scheduled guided tour, or assist you with booking. We never sell, rent, or trade your personal details.
        </p>
        <p>
          <strong className="text-ink">Analytics.</strong> We count anonymous aggregate actions such as search filters and button clicks to enhance the website speed and usability, without tracking personal identities.
        </p>
        <p>
          <strong className="text-ink">Local storage.</strong> Your theme preference and comparison selections are saved locally in your browser.
        </p>
        <p>
          <strong className="text-ink">Your choices.</strong> You can contact the Luxora PG support desk at any time to inspect or delete your inquiry details.
        </p>
      </div>
    </>
  );
}
