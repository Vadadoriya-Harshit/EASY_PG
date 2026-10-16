import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import { HelpCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { fetchCmsData } from "@/lib/cms-store";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Luxora PG Ahmedabad",
  description: "Clear, honest answers about rent, 100% refundable security deposits, food menus, biometric gate timings, visitor policies, and Wi-Fi.",
  alternates: { canonical: "/faq" },
};

export default async function FAQ() {
  const cms = await fetchCmsData();
  const faq = cms.faq;

  return (
    <>
      <PageHeader
        title={faq.title || "Frequently Asked Questions"}
        intro={faq.intro || "Everything you need to know about rent breakdown, refundable deposits, gate timings, food plans, and student culture."}
      />

      <div className="container-x max-w-4xl py-12 space-y-12">
        {(faq.categories || []).map((cat, idx) => (
          <section key={idx} className="space-y-4">
            <h2 className="text-xl font-bold text-brand flex items-center gap-2">
              <ShieldCheck size={20} /> {cat.category}
            </h2>

            <div className="card divide-y divide-ink/10 border-ink/10 overflow-hidden shadow-sm">
              {(cat.items || []).map((item, i) => (
                <details key={i} className="group p-5 sm:p-6 transition-colors hover:bg-ink/5">
                  <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-ink">
                    <span>{item.q}</span>
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-mute">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* Still Have Questions CTA */}
        <div className="card p-8 text-center bg-gradient-to-r from-brand/10 via-accent/10 to-transparent border-brand/20">
          <HelpCircle size={32} className="mx-auto text-brand" />
          <h3 className="mt-3 text-2xl font-bold">Have a specific question not listed here?</h3>
          <p className="mt-2 text-sm text-mute max-w-md mx-auto">
            Our property coordinators are available on WhatsApp and phone to clarify policies, current vacancies, and schedule free visits.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn btn-primary gap-2">
              Contact Property Coordinator <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
