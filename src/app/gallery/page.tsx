import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import InteractiveGallery from "@/components/InteractiveGallery";
import InteractiveRoomTour from "@/components/InteractiveRoomTour";
import { listProperties } from "@/lib/repo";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Photo & Video Gallery",
  description: "Browse verified high-definition photos of bedrooms, study lounges, hygienic cafeterias, and rooftop terraces across Luxora PG properties in Ahmedabad.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const props = await listProperties();
  const allRooms = props.flatMap((p) => p.rooms || []);

  return (
    <>
      <PageHeader
        title="Explore Our Spaces"
        intro="High-definition, authentic photographs and interactive 360° views across our boys' and girls' residences in Ahmedabad."
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
              Switch day/night lighting modes and tap 360° tour to look around verified room spaces.
            </p>
          </div>
          <InteractiveRoomTour rooms={allRooms} />
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
