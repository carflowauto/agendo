"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Flash, fieldClass, labelClass } from "@/components/ui";
import { addDays, formatDayLong, formatDayShort, formatDuration, formatTime, isoDow, mondayOf, parisDateKey, parisMinutes, zonedWallTimeToUtc } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { formatPhone, telHref } from "@/lib/phone";
import { cancelAppointment, createAppointment, createBlock, moveAppointment } from "@/server/actions";
import type { Appointment, ClientRow, Service } from "@/lib/types";

const HOUR_PX = 64;
const DAY_START = 8 * 60;
const DAY_END = 20 * 60;
const LETTERS = ["", "L", "M", "M", "J", "V", "S", "D"];

type ClientPick = Pick<ClientRow, "id" | "full_name" | "phone">;
type ServicePick = Pick<Service, "id" | "name">;

function bounds(items: Appointment[]) {
  let start = DAY_START;
  let end = DAY_END;
  for (const item of items) {
    start = Math.min(start, Math.floor(parisMinutes(item.starts_at) / 60) * 60);
    end = Math.max(end, Math.ceil(parisMinutes(item.ends_at) / 60) * 60);
  }
  if (end <= start) end = start + 60;
  return { start, end };
}

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

function cardTone(item: Appointment) {
  if (isBlock(item)) return "border border-dashed border-slate-300 bg-slate-100/90 text-slate-700";
  if (item.source === "online") return "border-l-4 border-violet-500 bg-violet-50 text-violet-950";
  if (item.source === "invitation") return "border-l-4 border-fuchsia-400 bg-fuchsia-50 text-fuchsia-950";
  return "border-l-4 border-brand-500 bg-white text-slate-900 shadow-sm";
}

function dayHref(date: string) {
  return `/espace/agenda?jour=${date}`;
}

export function AgendaScreen({
  day,
  today,
  week,
  items,
  services,
  clients,
  ok,
  erreur,
  openAdd = false,
}: {
  day: string;
  today: string;
  week: boolean;
  items: Appointment[];
  services: ServicePick[];
  clients: ClientPick[];
  ok?: string;
  erreur?: string;
  openAdd?: boolean;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"add" | "block" | null>(openAdd ? "add" : null);
  const [now, setNow] = useState<Date | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dayScroller = useRef<HTMLDivElement>(null);
  const monday = mondayOf(day);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(monday, index)), [monday]);
  const dayItems = items.filter((item) => parisDateKey(new Date(item.starts_at)) === day);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const range = bounds(week ? items : dayItems);
  const back = dayHref(day);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const node = dayScroller.current;
    if (!node || day !== today) return;
    const nowMin = parisMinutes(new Date().toISOString());
    const start = bounds(items.filter((item) => parisDateKey(new Date(item.starts_at)) === day)).start;
    node.scrollTop = Math.max(0, ((nowMin - start) / 60) * HOUR_PX - 72);
  }, [day, today, items]);

  function closeSheets() {
    setSelectedId(null);
    setSheet(null);
  }

  function dropOn(targetDay: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (!id) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const span = range.end - range.start;
    const ratio = Math.min(0.98, Math.max(0, (event.clientY - rect.top) / rect.height));
    const minutes = Math.min(range.end - 15, range.start + Math.round((ratio * span) / 15) * 15);
    const iso = zonedWallTimeToUtc(targetDay, minutesLabel(minutes)).toISOString();
    startTransition(async () => {
      const result = await moveAppointment(id, iso);
      if (result.error) setMoveError(result.error);
      else {
        setMoveError(null);
        router.refresh();
      }
    });
  }

  return (
    <div className={`relative flex h-full min-h-0 flex-col px-3 pt-3 sm:px-4 ${pending ? "opacity-80" : ""}`}>
      <header className="shrink-0">
        <div className="flex items-center gap-2">
          <Link href={week ? `/espace/agenda?vue=semaine&semaine=${addDays(monday, -7)}&jour=${addDays(day, -7)}` : dayHref(addDays(day, -1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-700 shadow-sm" aria-label={week ? "Semaine précédente" : "Jour précédent"}>‹</Link>
          <p className="min-w-0 flex-1 truncate text-center text-sm font-bold text-slate-900">
            <span className={week ? "lg:hidden" : ""}>{formatDayLong(day)}</span>
            {week ? <span className="hidden lg:inline">{formatDayShort(monday)} – {formatDayShort(addDays(monday, 6))}</span> : null}
          </p>
          <Link href={week ? `/espace/agenda?vue=semaine&semaine=${addDays(monday, 7)}&jour=${addDays(day, 7)}` : dayHref(addDays(day, 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-700 shadow-sm" aria-label={week ? "Semaine suivante" : "Jour suivant"}>›</Link>
          <Link href={dayHref(today)} className={`flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-semibold ${day === today && !week ? "bg-brand-50 text-brand-700" : "bg-white text-slate-700 shadow-sm"}`}>Aujourd’hui</Link>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {weekDays.map((date) => {
            const on = date === day;
            const busy = items.some((item) => parisDateKey(new Date(item.starts_at)) === date);
            return (
              <Link key={date} href={dayHref(date)} className="flex flex-col items-center rounded-xl py-1">
                <span className="text-[10px] font-semibold text-slate-400">{LETTERS[isoDow(date)]}</span>
                <span className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${on ? "grad text-white" : date === today ? "text-brand-700" : "text-slate-800"}`}>{Number(date.slice(8))}</span>
                <span className={`mt-0.5 h-1 w-1 rounded-full ${busy && !on ? "bg-brand-400" : "bg-transparent"}`} />
              </Link>
            );
          })}
        </div>
        <div className="mt-1 hidden justify-end lg:flex">
          <div className="flex rounded-full bg-white/80 p-1 text-xs font-semibold shadow-sm">
            <Link href={dayHref(day)} className={`rounded-full px-3 py-1 ${week ? "text-slate-500" : "bg-white text-brand-700 shadow-sm"}`}>Jour</Link>
            <Link href={`/espace/agenda?vue=semaine&semaine=${monday}&jour=${day}`} className={`rounded-full px-3 py-1 ${week ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}>Semaine</Link>
          </div>
        </div>
        <div className="mt-2">
          <Flash ok={ok} erreur={erreur ?? moveError ?? undefined} />
        </div>
      </header>

      <div ref={dayScroller} className={`mt-1 min-h-0 flex-1 overflow-y-auto pb-16 ${week ? "lg:hidden" : ""}`}>
        <DayGrid day={day} today={today} items={dayItems} now={now} range={range} onOpen={setSelectedId} />
      </div>
      {week ? (
        <div className="mt-1 hidden min-h-0 flex-1 overflow-y-auto pb-16 lg:block">
          <WeekGrid days={weekDays} today={today} items={items} now={now} range={range} onOpen={setSelectedId} onDrop={dropOn} />
        </div>
      ) : null}

      {selected ? <DetailSheet item={selected} back={back} onClose={closeSheets} /> : null}
      {sheet ? (
        <AddSheet mode={sheet} day={day} services={services} clients={clients} onMode={setSheet} onClose={closeSheets} />
      ) : null}

      {selected || sheet ? null : (
        <button type="button" onClick={() => setSheet("add")} className="absolute bottom-3 right-3 z-20 flex h-14 w-14 items-center justify-center rounded-full grad text-3xl font-light leading-none text-white shadow-lg shadow-brand-500/30" aria-label="Ajouter un rendez-vous">+</button>
      )}
    </div>
  );
}

function DayGrid({
  day,
  today,
  items,
  now,
  range,
  onOpen,
}: {
  day: string;
  today: string;
  items: Appointment[];
  now: Date | null;
  range: { start: number; end: number };
  onOpen: (id: string) => void;
}) {
  const height = ((range.end - range.start) / 60) * HOUR_PX;
  const hours = Array.from({ length: (range.end - range.start) / 60 + 1 }, (_, index) => range.start + index * 60);
  const nowMin = now && day === today ? parisMinutes(now.toISOString()) : null;
  const showNow = nowMin !== null && nowMin >= range.start && nowMin <= range.end;

  return (
    <div>
      {items.length === 0 ? <p className="mb-2 rounded-2xl bg-white/80 px-3 py-3 text-center text-sm text-slate-500">Aucun rendez-vous ce jour</p> : null}
      <div className="relative" style={{ height }}>
        {hours.map((minute) => (
          <div key={minute} className="absolute inset-x-0 border-t border-slate-200/80" style={{ top: ((minute - range.start) / 60) * HOUR_PX }}>
            <span className="-mt-2 block w-11 text-[11px] font-medium text-slate-400">{minutesLabel(minute)}</span>
          </div>
        ))}
        {showNow && nowMin !== null ? (
          <div className="pointer-events-none absolute right-0 left-11 z-10 border-t-2 border-rose-500" style={{ top: ((nowMin - range.start) / 60) * HOUR_PX }}>
            <span className="absolute -left-1 -top-[5px] h-2.5 w-2.5 rounded-full bg-rose-500" />
          </div>
        ) : null}
        {items.map((item) => {
          const start = parisMinutes(item.starts_at);
          const dur = durationOf(item);
          const top = ((start - range.start) / 60) * HOUR_PX;
          const cardHeight = Math.max((dur / 60) * HOUR_PX - 4, 28);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.id)}
              className={`absolute right-0 left-12 overflow-hidden rounded-xl px-2 py-1 text-left ${cardTone(item)}`}
              style={{ top: top + 2, height: cardHeight }}
            >
              <span className="block truncate text-[11px] font-semibold">{formatTime(item.starts_at)} · {formatDuration(dur)}</span>
              <span className="block truncate text-sm font-bold">{isBlock(item) ? item.service_name || "Indisponible" : item.client_name || "Cliente"}</span>
              {cardHeight > 46 ? <span className="block truncate text-[11px] opacity-75">{isBlock(item) ? "Créneau fermé" : item.service_name}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  days,
  today,
  items,
  now,
  range,
  onOpen,
  onDrop,
}: {
  days: string[];
  today: string;
  items: Appointment[];
  now: Date | null;
  range: { start: number; end: number };
  onOpen: (id: string) => void;
  onDrop: (day: string, event: DragEvent<HTMLDivElement>) => void;
}) {
  const height = ((range.end - range.start) / 60) * HOUR_PX;
  const hours = Array.from({ length: (range.end - range.start) / 60 }, (_, index) => range.start + index * 60);
  const nowMin = now && days.includes(today) ? parisMinutes(now.toISOString()) : null;
  const showNow = nowMin !== null && nowMin >= range.start && nowMin <= range.end;

  return (
    <div className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] gap-1">
      <div />
      {days.map((date) => (
        <Link key={date} href={dayHref(date)} className={`rounded-lg py-1 text-center ${date === today ? "text-brand-700" : "text-slate-500"}`}>
          <span className="block text-[10px] font-semibold">{LETTERS[isoDow(date)]}</span>
          <span className="block text-sm font-bold">{Number(date.slice(8))}</span>
        </Link>
      ))}
      <div className="relative" style={{ height }}>
        {hours.map((minute) => (
          <span key={minute} className="absolute left-0 text-[10px] text-slate-400" style={{ top: ((minute - range.start) / 60) * HOUR_PX - 6 }}>{minutesLabel(minute)}</span>
        ))}
      </div>
      {days.map((date) => (
        <div key={date} className="relative rounded-xl bg-white/70" style={{ height }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDrop(date, event)}>
          {hours.map((minute) => (
            <div key={minute} className="absolute inset-x-0 border-t border-slate-100" style={{ top: ((minute - range.start) / 60) * HOUR_PX }} />
          ))}
          {showNow && date === today && nowMin !== null ? (
            <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-rose-500" style={{ top: ((nowMin - range.start) / 60) * HOUR_PX }} />
          ) : null}
          {items
            .filter((item) => parisDateKey(new Date(item.starts_at)) === date)
            .map((item) => {
              const start = parisMinutes(item.starts_at);
              const dur = durationOf(item);
              const top = ((start - range.start) / 60) * HOUR_PX;
              const cardHeight = Math.max((dur / 60) * HOUR_PX - 3, 22);
              return (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
                  onClick={() => onOpen(item.id)}
                  className={`absolute inset-x-0.5 overflow-hidden rounded-lg px-1 py-0.5 text-left ${cardTone(item)}`}
                  style={{ top: top + 1, height: cardHeight }}
                >
                  <span className="block truncate text-[10px] font-semibold">{formatTime(item.starts_at)}</span>
                  <span className="block truncate text-[11px] font-bold">{isBlock(item) ? item.service_name || "Bloqué" : item.client_name}</span>
                </button>
              );
            })}
        </div>
      ))}
    </div>
  );
}

function DetailSheet({ item, back, onClose }: { item: Appointment; back: string; onClose: () => void }) {
  const blocked = isBlock(item);
  const dur = durationOf(item);
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-slate-900/30" onClick={onClose}>
      <div className="max-h-[85%] w-full overflow-y-auto rounded-t-3xl bg-white px-4 pb-5 pt-3 shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Détail du rendez-vous">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-slate-900">{blocked ? item.service_name || "Indisponible" : item.client_name || "Cliente"}</p>
            <p className="text-sm text-slate-500">{formatTime(item.starts_at)} – {formatTime(item.ends_at)} · {formatDuration(dur)}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${blocked ? "bg-slate-100 text-slate-600" : "bg-brand-50 text-brand-700"}`}>{blocked ? "Bloqué" : "Confirmé"}</span>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          {blocked ? null : (
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Prestation</dt>
              <dd className="font-semibold text-slate-900">{item.service_name || "—"}</dd>
            </div>
          )}
          {item.price_cents && !blocked ? (
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Prix</dt>
              <dd className="font-semibold text-slate-900">{formatEuro(item.price_cents)}</dd>
            </div>
          ) : null}
          {!blocked && item.client_phone ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Téléphone</dt>
              <dd><a href={telHref(item.client_phone)} className="font-semibold text-brand-700">{formatPhone(item.client_phone)}</a></dd>
            </div>
          ) : null}
        </dl>
        {!blocked && item.client_phone ? (
          <a href={telHref(item.client_phone)} className="mt-4 flex h-11 items-center justify-center rounded-2xl bg-brand-50 text-sm font-semibold text-brand-800">Appeler</a>
        ) : null}
        <form action={cancelAppointment} className="mt-3">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="back" value={back} />
          <button className="h-11 w-full rounded-2xl text-sm font-semibold text-rose-600">{blocked ? "Retirer le blocage" : "Annuler le rendez-vous"}</button>
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
    <div className="absolute inset-0 z-30 flex items-end bg-slate-900/30" onClick={onClose}>
      <div className="max-h-[85%] w-full overflow-y-auto rounded-t-3xl bg-white px-4 pb-5 pt-3 shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Ajouter">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
        <div className="flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
          <button type="button" onClick={() => onMode("add")} className={`h-9 flex-1 rounded-full ${mode === "add" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}>Rendez-vous</button>
          <button type="button" onClick={() => onMode("block")} className={`h-9 flex-1 rounded-full ${mode === "block" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}>Bloquer</button>
        </div>
        {mode === "add" ? (
          services.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">Ajoute une prestation dans Réglages pour poser un rendez-vous. Tu peux déjà bloquer un créneau.</p>
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
              <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Enregistrer</button>
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
            <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Bloquer</button>
          </form>
        )}
      </div>
    </div>
  );
}
