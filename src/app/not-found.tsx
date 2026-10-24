import Link from "next/link";
export default function NotFound() {
  return (<div className="container-x grid min-h-[60vh] place-items-center text-center"><div><h1 className="text-6xl font-bold">404</h1><p className="mt-3 text-mute">We couldn't find that page.</p><Link href="/pgs" className="btn btn-primary mt-6">Browse PGs</Link></div></div>);
}
