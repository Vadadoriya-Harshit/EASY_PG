export default function DemoNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p role="note" className="mb-6 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
      Sample details shown. Rent, address and availability are placeholders until the owner confirms them.
    </p>
  );
}
