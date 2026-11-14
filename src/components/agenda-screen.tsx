"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Flash, fieldClass, labelClass } from "@/components/ui";
import { addDays, formatDuration, formatTime, isoDow, parisDateKey, parisMinutes } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { formatPhone, telHref } from "@/lib/phone";
import { cancelAppointment, createAppointment, createBlock, loadAgendaRange } from "@/server/actions";
import type { Appointment, ClientRow, Service } from "@/lib/types";

const HOUR_PX = 56;
const DAY_START = 8 * 60;
const DAY_END = 20 * 60;
const DAY_LABEL = ["", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const INITIAL_DAYS = 14;
const CHUNK = 7;

type ClientPick = Pick<ClientRow, "id" | "full_name" | "phone">;
type ServicePick = Pick<Service, "id" | "name">;

function minutesLabel(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function durationOf(item: Appointment) {
  if (item.duration_min && item.duration_min > 0) return item.duration_min;
  return Math.max(15, Math.round((new Date(item.ends_at).getTime() - new Date(item.starts_at).getTime()) / 60_000));
}

function isBlock(item: Appointment) {
  return item.status === "blocked" || item.source === "block";
}

function dayTitle(date: string) {
  return `${DAY_LABEL[isoDow(date)]} ${Number(date.slice(8))}`;
}

export function AgendaScreen({
  today,
  items,
  services,
  clients,
  ok,
  erreur,
  openAdd = false,
}: {
  today: string;
  items: Appointment[];
  services: ServicePick[];
  clients: ClientPick[];
  ok?: string;
  erreur?: string;
  openAdd?: boolean;
}) {
  const [loaded, setLoaded] = useState(items);
  const [dayCount, setDayCount] = useState(INITIAL_DAYS);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"add" | "block" | null>(openAdd ? "add" : null);
  const [now, setNow] = useState<Date | null>(null);
  const [colWidth, setColWidth] = useState(110);
  const scroller = useRef<HTMLDivElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const days = useMemo(() => Array.from({ length: dayCount }, (_, index) => addDays(today, index)), [today, dayCount]);
  const selected = loaded.find((item) => item.id === selectedId) ?? null;
  const height = ((DAY_END - DAY_START) / 60) * HOUR_PX;
  const hours = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, index) => DAY_START + index * 60);
  const nowMin = now ? parisMinutes(now.toISOString()) : null;
  const showNow = nowMin !== null && parisDateKey(now!) === today && nowMin >= DAY_START && nowMin <= DAY_END;

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const measure = () => setColWidth(Math.max(96, node.clientWidth / 3));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    const top = showNow && nowMin !== null ? ((nowMin - DAY_START) / 60) * HOUR_PX - 80 : 0;
    node.scrollTop = Math.max(0, top);
    if (gutter.current) gutter.current.scrollTop = node.scrollTop;
    return () => observer.disconnect();
  }, [showNow, nowMin]);

  async function onScroll() {
    const node = scroller.current;
    if (!node) return;
    if (gutter.current) gutter.current.scrollTop = node.scrollTop;
    if (loading) return;
    if (node.scrollLeft + node.clientWidth < node.scrollWidth - colWidth) return;
    const from = addDays(today, dayCount);
    setLoading(true);
    try {
      const more = await loadAgendaRange(from, CHUNK);
      setLoaded((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...more.filter((item) => !seen.has(item.id))];
      });
      setDayCount((count) => count + CHUNK);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-white text-[#4A1238]">
      {ok || erreur ? <div className="shrink-0 px-4"><Flash ok={ok} erreur={erreur} /></div> : null}
      <div className="flex min-h-0 flex-1">
        <div ref={gutter} className="w-10 shrink-0 overflow-hidden">
          <div className="relative" style={{ height, marginTop: 32 }}>
            {hours.map((minute) => (
              <span key={minute} className="absolute left-1 -translate-y-1/2 text-[10px] font-medium text-[#B7A8B0]" style={{ top: ((minute - DAY_START) / 60) * HOUR_PX }}>
                {minutesLabel(minute)}
              </span>
            ))}
          </div>
        </div>
        <div ref={scroller} className="h-full min-w-0 flex-1 snap-x snap-mandatory overflow-auto" onScroll={() => void onScroll()}>
          <div className="flex" style={{ width: days.length * colWidth }}>
            {days.map((date) => (
              <section key={date} className="snap-start shrink-0" style={{ width: colWidth }}>
                <h2 className={`sticky top-0 z-20 bg-white px-1 py-1.5 text-center text-[12px] font-semibold ${date === today ? "text-[#D9577A]" : "text-[#4A1238]"}`}>{dayTitle(date)}</h2>
                <div className="relative" style={{ height }}>
                  {hours.map((minute) => (
                    <div key={minute} className="absolute inset-x-1 border-t border-[#F6E6EA]" style={{ top: ((minute - DAY_START) / 60) * HOUR_PX }} />
                  ))}
                  {showNow && date === today && nowMin !== null ? (
                    <div className="pointer-events-none absolute inset-x-1 z-10 border-t-2 border-[#E11D48]" style={{ top: ((nowMin - DAY_START) / 60) * HOUR_PX }}>
                      <span className="absolute -left-1 -top-[5px] h-2.5 w-2.5 rounded-full bg-[#E11D48]" />
                    </div>
                  ) : null}
                  {loaded
                    .filter((item) => parisDateKey(new Date(item.starts_at)) === date)
                    .map((item) => {
                      const start = parisMinutes(item.starts_at);
                      const dur = durationOf(item);
                      const compact = dur < 45;
                      const top = ((start - DAY_START) / 60) * HOUR_PX + 2;
                      const cardHeight = Math.max((dur / 60) * HOUR_PX - 4, compact ? 48 : 56);
                      const label = isBlock(item) ? item.service_name || "Bloqué" : item.client_name || "Cliente";
                      const service = isBlock(item) ? "Fermé" : item.service_name || "Rendez-vous";
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className={`absolute inset-x-1 z-[1] rounded-xl px-1.5 py-1 text-left text-[#4A1238] ${isBlock(item) ? "border border-dashed border-[#E7D0D8] bg-white" : "bg-[#FDECEF]"}`}
                          style={{ top, height: cardHeight }}
                        >
                          {compact ? (
                            <span className="block text-[11px] font-semibold leading-[15px]">{formatTime(item.starts_at)} · {label} · {service}</span>
                          ) : (
                            <span className="block py-1">
                              <span className="block truncate text-[10px] font-semibold text-[#D9577A]">{formatTime(item.starts_at)} · {formatDuration(dur)}</span>
                              <span className="block text-[12px] font-bold leading-tight">{label}</span>
                              <span className="block text-[11px] leading-tight text-[#8E7F87]">{service}</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
      {selected ? <DetailSheet item={selected} onClose={() => setSelectedId(null)} /> : null}
      {sheet ? <AddSheet mode={sheet} day={today} services={services} clients={clients} onMode={setSheet} onClose={() => setSheet(null)} /> : null}
      {selected || sheet ? null : (
        <button type="button" onClick={() => setSheet("add")} className="absolute bottom-3 right-3 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#E56B8C] to-[#4A1238] text-white shadow-[0_8px_18px_rgba(74,18,56,0.28)]" aria-label="Ajouter un rendez-vous">
          <Plus className="h-7 w-7" strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

function DetailSheet({ item, onClose }: { item: Appointment; onClose: () => void }) {
  const blocked = isBlock(item);
  const dur = durationOf(item);
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-[#4A1238]/30" onClick={onClose}>
      <div className="max-h-[85%] w-full overflow-y-auto rounded-t-3xl bg-white px-4 pb-5 pt-3 shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Détail du rendez-vous">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#F3D5DC]" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-[#4A1238]">{blocked ? item.service_name || "Indisponible" : item.client_name || "Cliente"}</p>
            <p className="text-sm text-[#8E7F87]">{formatTime(item.starts_at)} – {formatTime(item.ends_at)} · {formatDuration(dur)}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${blocked ? "bg-[#F7F1F3] text-[#8E7F87]" : "bg-[#FDECEF] text-[#D9577A]"}`}>{blocked ? "Bloqué" : "Confirmé"}</span>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          {blocked ? null : (
            <div className="flex justify-between gap-3">
              <dt className="text-[#8E7F87]">Prestation</dt>
              <dd className="font-semibold text-[#4A1238]">{item.service_name || "—"}</dd>
            </div>
          )}
          {item.price_cents && !blocked ? (
            <div className="flex justify-between gap-3">
              <dt className="text-[#8E7F87]">Prix</dt>
              <dd className="font-semibold text-[#4A1238]">{formatEuro(item.price_cents)}</dd>
            </div>
          ) : null}
          {!blocked && item.client_phone ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#8E7F87]">Téléphone</dt>
              <dd><a href={telHref(item.client_phone)} className="font-semibold text-[#D9577A]">{formatPhone(item.client_phone)}</a></dd>
            </div>
          ) : null}
        </dl>
        {!blocked && item.client_phone ? (
          <a href={telHref(item.client_phone)} className="mt-4 flex h-11 items-center justify-center rounded-full bg-[#D9577A] text-sm font-semibold text-white">Appeler</a>
        ) : null}
        <form action={cancelAppointment} className="mt-3">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="back" value="/espace/agenda" />
          <button className="h-11 w-full rounded-2xl text-sm font-semibold text-[#D9577A]">{blocked ? "Retirer le blocage" : "Annuler le rendez-vous"}</button>
        </form>
      </div>
    </div>
  );
}

function AddSheet({
  mode,
  day,
  services,
  clients,
  onMode,
  onClose,
}: {
  mode: "add" | "block";
  day: string;
  services: ServicePick[];
  clients: ClientPick[];
  onMode: (mode: "add" | "block") => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-[#4A1238]/30" onClick={onClose}>
      <div className="max-h-[85%] w-full overflow-y-auto rounded-t-3xl bg-white px-4 pb-5 pt-3 shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Ajouter">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#F3D5DC]" />
        <div className="flex rounded-full bg-[#FDECEF] p-1 text-sm font-semibold">
          <button type="button" onClick={() => onMode("add")} className={`h-9 flex-1 rounded-full ${mode === "add" ? "bg-white text-[#D9577A] shadow-sm" : "text-[#8E7F87]"}`}>Rendez-vous</button>
          <button type="button" onClick={() => onMode("block")} className={`h-9 flex-1 rounded-full ${mode === "block" ? "bg-white text-[#D9577A] shadow-sm" : "text-[#8E7F87]"}`}>Bloquer</button>
        </div>
        {mode === "add" ? (
          services.length === 0 ? (
            <p className="mt-4 text-sm text-[#8E7F87]">Ajoute une prestation dans Réglages pour poser un rendez-vous. Tu peux déjà bloquer un créneau.</p>
          ) : (
            <form action={createAppointment} className="mt-4 space-y-2">
              <label className={labelClass}>Cliente<input name="name" required list="agenda-clientes" className={fieldClass} /></label>
              <datalist id="agenda-clientes">{clients.map((client) => <option key={client.id} value={client.full_name}>{client.phone}</option>)}</datalist>
              <label className={labelClass}>Téléphone<input name="phone" className={fieldClass} placeholder="Si la fiche existe déjà" /></label>
              <label className={labelClass}>Prestation
                <select name="service_id" required className={fieldClass}>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className={labelClass}>Date<input type="date" name="date" required defaultValue={day} className={fieldClass} /></label>
                <label className={labelClass}>Heure<input type="time" name="time" required defaultValue="10:00" className={fieldClass} /></label>
              </div>
              <button className="h-11 w-full rounded-full bg-[#D9577A] text-sm font-semibold text-white">Enregistrer</button>
            </form>
          )
        ) : (
          <form action={createBlock} className="mt-4 space-y-2">
            <label className={labelClass}>Libellé<input name="label" defaultValue="Pause" className={fieldClass} /></label>
            <label className={labelClass}>Date<input type="date" name="date" required defaultValue={day} className={fieldClass} /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className={labelClass}>Début<input type="time" name="start" required defaultValue="12:30" className={fieldClass} /></label>
              <label className={labelClass}>Fin<input type="time" name="end" required defaultValue="13:30" className={fieldClass} /></label>
            </div>
            <button className="h-11 w-full rounded-full bg-[#D9577A] text-sm font-semibold text-white">Bloquer</button>
          </form>
        )}
      </div>
    </div>
  );
}
