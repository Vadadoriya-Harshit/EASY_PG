"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Drag-and-drop reordering that works with mouse, touch and pen (Pointer Events) and has a full keyboard path:
 * focus a grip and press Arrow keys, or use the move up / move down buttons.
 * Items keep their own markup; wrap them in <SortableItem> and drop a <DragHandle/> (and optionally <MoveButtons/>) inside.
 */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = arr.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

interface ListCtx {
  count: number;
  from: number | null;
  over: number | null;
  dx: number;
  dy: number;
  start: (index: number, e: React.PointerEvent) => void;
  move: (from: number, to: number) => void;
}
const ListContext = createContext<ListCtx | null>(null);
const ItemContext = createContext<{ index: number } | null>(null);

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}

export function SortableList<T>({
  items, onChange, className, children, label = "items", itemLabel,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  className?: string;
  children: React.ReactNode;
  label?: string;
  itemLabel?: (item: T, index: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ from: number; over: number; dx: number; dy: number } | null>(null);
  const [announce, setAnnounce] = useState("");
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const move = useCallback((from: number, to: number) => {
    const cur = itemsRef.current;
    if (to < 0 || to >= cur.length || from === to) return;
    onChangeRef.current(moveItem(cur, from, to));
    setAnnounce(`${itemLabel ? itemLabel(cur[from], from) : `Item ${from + 1}`} moved to position ${to + 1} of ${cur.length}`);
    // keep keyboard focus on the grip of the moved item
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>(`:scope > [data-sort-index="${to}"] [data-sort-handle]`)?.focus());
  }, [itemLabel]);

  const start = useCallback((index: number, e: React.PointerEvent) => {
    if (e.button !== undefined && e.button !== 0) return;
    const root = ref.current;
    if (!root) return;
    e.preventDefault();
    e.stopPropagation();
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-sort-index]"));
    const sp = scrollParent(root);
    const scroll0 = sp ? sp.scrollTop : window.scrollY;
    // centres in document-like coordinates so auto-scrolling while dragging stays correct
    const centres = nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 + scroll0 };
    });
    const startX = e.clientX, startY = e.clientY + scroll0;
    let last = { x: e.clientX, y: e.clientY };
    let raf = 0;

    const compute = () => {
      const scrollNow = sp ? sp.scrollTop : window.scrollY;
      const px = last.x, py = last.y + scrollNow;
      const dx = px - startX, dy = py - startY;
      const cx = centres[index].x + dx, cy = centres[index].y + dy;
      let best = index, bestD = Infinity;
      centres.forEach((c, i) => {
        const d = (c.x - cx) ** 2 + (c.y - cy) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      setDrag({ from: index, over: best, dx, dy });
    };
    const tick = () => {
      // edge auto-scroll
      const bounds = sp ? sp.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
      const zone = 70;
      let v = 0;
      if (last.y < bounds.top + zone) v = -Math.ceil((bounds.top + zone - last.y) / 5);
      else if (last.y > bounds.bottom - zone) v = Math.ceil((last.y - (bounds.bottom - zone)) / 5);
      if (v) { if (sp) sp.scrollTop += v; else window.scrollBy(0, v); compute(); }
      raf = requestAnimationFrame(tick);
    };
    const onMove = (ev: PointerEvent) => { last = { x: ev.clientX, y: ev.clientY }; compute(); };
    const finish = (commit: boolean) => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      setDrag((d) => {
        if (commit && d && d.over !== d.from) {
          const cur = itemsRef.current;
          onChangeRef.current(moveItem(cur, d.from, d.over));
          setAnnounce(`${itemLabel ? itemLabel(cur[d.from], d.from) : `Item ${d.from + 1}`} moved to position ${d.over + 1} of ${cur.length}`);
        }
        return null;
      });
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") finish(false); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    raf = requestAnimationFrame(tick);
    setDrag({ from: index, over: index, dx: 0, dy: 0 });
  }, [itemLabel]);

  useEffect(() => () => setDrag(null), []);

  return (
    <ListContext.Provider value={{ count: items.length, from: drag?.from ?? null, over: drag?.over ?? null, dx: drag?.dx ?? 0, dy: drag?.dy ?? 0, start, move }}>
      <div ref={ref} className={className} role="list" aria-label={`Reorderable ${label}`}>
        {children}
      </div>
      <div className="sr-only" role="status" aria-live="polite">{announce}</div>
    </ListContext.Provider>
  );
}

export function SortableItem({ index, className, id, children }: { index: number; className?: string; id?: string; children: React.ReactNode }) {
  const ctx = useContext(ListContext);
  const dragging = ctx?.from === index;
  const target = ctx && ctx.from !== null && ctx.over === index && ctx.from !== index;
  return (
    <ItemContext.Provider value={{ index }}>
      <div
        id={id}
        role="listitem"
        data-sort-index={index}
        className={cn(className, "relative", dragging && "z-30 cursor-grabbing opacity-90 shadow-2xl ring-2 ring-brand", target && "ring-2 ring-accent ring-offset-2 ring-offset-bg")}
        style={dragging && ctx ? { transform: `translate3d(${ctx.dx}px, ${ctx.dy}px, 0) scale(1.01)`, transition: "none", pointerEvents: "none" } : undefined}
      >
        {children}
      </div>
    </ItemContext.Provider>
  );
}

export function DragHandle({ label = "Drag to reorder. Or focus and press the arrow keys." }: { label?: string }) {
  const list = useContext(ListContext);
  const item = useContext(ItemContext);
  if (!list || !item) return null;
  const { index } = item;
  return (
    <button
      type="button"
      data-sort-handle
      aria-label={label}
      title="Drag to reorder"
      onPointerDown={(e) => list.start(index, e)}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); list.move(index, index - 1); }
        else if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); list.move(index, index + 1); }
        else if (e.key === "Home") { e.preventDefault(); list.move(index, 0); }
        else if (e.key === "End") { e.preventDefault(); list.move(index, list.count - 1); }
      }}
      style={{ touchAction: "none" }}
      className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg border border-ink/10 bg-surface text-mute transition hover:border-brand/40 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand active:cursor-grabbing"
    >
      <GripVertical size={16} />
    </button>
  );
}

export function MoveButtons({ className }: { className?: string }) {
  const list = useContext(ListContext);
  const item = useContext(ItemContext);
  if (!list || !item) return null;
  const { index } = item;
  const btn = "flex h-9 w-9 items-center justify-center rounded-lg border border-ink/10 bg-surface text-mute transition hover:text-brand disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <span className={cn("inline-flex gap-1", className)}>
      <button type="button" className={btn} onClick={() => list.move(index, index - 1)} disabled={index === 0} aria-label="Move up" title="Move up"><ArrowUp size={15} /></button>
      <button type="button" className={btn} onClick={() => list.move(index, index + 1)} disabled={index === list.count - 1} aria-label="Move down" title="Move down"><ArrowDown size={15} /></button>
    </span>
  );
}

/** Convenience: grip + up/down buttons in one cluster. */
export function ReorderControls({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <DragHandle />
      <MoveButtons />
    </span>
  );
}
