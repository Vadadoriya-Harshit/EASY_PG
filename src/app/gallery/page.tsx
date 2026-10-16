import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import InteractiveGallery from "@/components/InteractiveGallery";
import InteractiveRoomTour from "@/components/InteractiveRoomTour";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Photo & Video Gallery | Sorath PG Ahmedabad",
  description: "Browse verified high-definition photos of bedrooms, study lounges, hygienic cafeterias, and rooftop terraces across Sorath PG properties in Ahmedabad.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        title="Explore Our Spaces"
        intro="High-definition, authentic photographs and interactive 360° views across our boys' and girls' residences in Satellite, Vastrapur, Navrangpura, and Thaltej."
      />

      <div className="container-x py-12 space-y-16">
        {/* Interactive 360 Visualizer */}
        <section aria-labelledby="interactive-tour-title">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">Virtual Exploration</span>
            <h2 id="interactive-tour-title" className="text-2xl font-bold sm:text-3xl">
              Interactive Room & Amenity Inspector
            </h2>
            <p className="mt-1 text-sm text-mute">
              Switch day/night lighting modes and tap pins to see real specifications of mattresses, study pods, and washrooms.
            </p>
          </div>
          <InteractiveRoomTour />
        </section>

        {/* Filterable Image Grid */}
        <section aria-labelledby="curated-photos-title">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">Photo Library</span>
            <h2 id="curated-photos-title" className="text-2xl font-bold sm:text-3xl">
              Curated Property & Space Gallery
            </h2>
            <p className="mt-1 text-sm text-mute">
              Click any photo to view full-screen with high-res details and location context.
            </p>
          </div>
          <InteractiveGallery />
        </section>
      </div>
    </>
  );
}
