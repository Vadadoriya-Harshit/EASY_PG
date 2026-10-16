import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import InquiryForm from "@/components/InquiryForm";
import ContactActions from "@/components/ContactActions";
import { fetchCmsData } from "@/lib/cms-store";
import { listAreas } from "@/lib/repo";
import { waMessage } from "@/lib/utils";
import { Phone, Mail, Clock, MessageSquare, MapPin } from "lucide-react";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact Luxora PG | Inquiries & Visit Scheduling",
  description: "Get in touch with Luxora PG Ahmedabad coordinators. Schedule a free property visit, inquire via WhatsApp, or call directly.",
  alternates: { canonical: "/contact" },
};

export default async function Contact() {
  const [areas, cms] = await Promise.all([listAreas(), fetchCmsData()]);
  const contact = cms.contact;

  const phone = contact.phone || "+91 98250 12345";
  const whatsapp = contact.whatsapp || "919825012345";
  const email = contact.email || "contact@luxorapg.com";
  const address = contact.address || "Luxora House, Opp. Shivranjani Cross Road, Satellite, Ahmedabad, Gujarat 380015";
  const visitingHours = contact.visitingHours || "10:00 AM – 7:30 PM (Daily)";
  const branches = contact.branches || [];

  return (
    <>
      <PageHeader
        title="Connect With Our Coordinators"
        intro="Schedule a free property walkthrough, request a callback, or chat directly on WhatsApp. We reply within 30 minutes during business hours."
      />

      <div className="container-x py-12 space-y-12">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Left Contact Channels */}
          <div className="space-y-6 lg:col-span-5">
            {/* Quick Action Buttons */}
            <ContactActions message={waMessage()} />

            {/* Main Contact Card */}
            <div className="card p-6 space-y-4 border-ink/10 shadow-md">
              <h3 className="font-bold text-lg text-ink">Central Coordination Desk</h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <Phone size={16} className="mt-0.5 text-brand shrink-0" />
                  <div>
                    <span className="font-semibold text-ink block">Direct Coordinator Helpline</span>
                    <a href={`tel:${phone}`} className="text-mute hover:text-brand transition">
                      {phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare size={16} className="mt-0.5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-ink block">WhatsApp Direct Chat</span>
                    <a
                      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello Luxora PG! I would like to inquire about room availability.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mute hover:text-emerald-500 transition"
                    >
                      +{whatsapp} (Instant Chat)
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 text-accent shrink-0" />
                  <div>
                    <span className="font-semibold text-ink block">Admissions & Verification Email</span>
                    <a href={`mailto:${email}`} className="text-mute hover:text-accent transition">
                      {email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 text-brand shrink-0" />
                  <div>
                    <span className="font-semibold text-ink block">Central Office</span>
                    <span className="text-mute">{address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={16} className="mt-0.5 text-mute shrink-0" />
                  <div>
                    <span className="font-semibold text-ink block">Visiting & Guided Tour Hours</span>
                    <span className="text-mute">{visitingHours}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Serviced Branches (Dynamic from CMS) */}
            <div className="card p-6 border-ink/10 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-mute">
                Physical Property Locations:
              </h3>
              <div className="space-y-3">
                {branches.map((b, i) => (
                  <div key={i} className="rounded-xl border border-ink/10 bg-bg p-3 text-xs">
                    <p className="font-bold text-ink">{b.name}</p>
                    <p className="text-mute mt-0.5">{b.address}</p>
                    {b.metro && (
                      <span className="inline-block mt-1 text-[11px] font-semibold text-accent">
                        🚇 {b.metro}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Inquiry & Scheduled Visit Form */}
          <div className="lg:col-span-7 relative">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">Direct Request Desk</span>
              <h2 className="text-2xl font-bold mt-1 text-ink">Book a Free Visit or Send Inquiry</h2>
              <p className="text-xs text-mute mt-1">
                Tell us your preferred locality and room type. We will confirm your visit slot instantly.
              </p>
            </div>
            <InquiryForm areas={areas} />
          </div>
        </div>
      </div>
    </>
  );
}
