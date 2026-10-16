import FullScreenLoader from "@/components/FullScreenLoader";

export default function AdminLoading() {
  return (
    <FullScreenLoader
      message="Accessing Admin Portal..."
      subtext="Loading analytics dashboards, occupancy metrics & live CMS database..."
    />
  );
}
