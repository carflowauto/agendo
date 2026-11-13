"use client";

import { useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { addDays, formatDayShort, formatHm, formatTime, parisDateKey, parisMinutes, zonedWallTimeToUtc } from "@/lib/dates";
import { moveAppointment } from "@/server/actions";
import type { Appointment } from "@/lib/types";

const START = 8 * 60;
const END = 20 * 60;
const SPAN = END - START;

function tone(item: Appointment) {
  if (item.status === "blocked" || item.source === "block") return "hatch border border-dashed border-slate-300 text-slate-700";
  if (item.source === "online") return "bg-brand-50 border-l-4 border-brand-500 text-brand-950";
  if (item.source === "invitation") return "bg-violet-50 border-l-4 border-violet-500 text-violet-950";
  return "bg-sky-50 border-l-4 border-sky-500 text-sky-950";
}

export function WeekAgenda({ weekStart, items }: { weekStart: string; items: Appointment[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const current = items.find((item) => item.id === selected) ?? null;

  function dropOn(day: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (!id) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(0.98, Math.max(0, (event.clientY - rect.top) / rect.height));
    const minutes = Math.min(END - 15, START + Math.round((ratio * SPAN) / 15) * 15);
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    const iso = zonedWallTimeToUtc(day, `${hh}:${mm}`).toISOString();
    startTransition(async () => {
      const result = await moveAppointment(id, iso);
      if (result.error) setError(result.error);
      else {
        setError(null);
        router.refresh();
      }
    });
  }

  return (
    <div className={pending ? "opacity-70" : ""}>
      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      <p className="mb-3 text-xs text-slate-500">Glissez un rendez-vous pour le déplacer. Les horaires sont ceux de Paris.</p>
      <div className="overflow-x-auto">
        <div className="min-w-[760px] grid grid-cols-[3.5rem_repeat(7,1fr)] gap-1">
          <div />
          {days.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-slate-600 pb-1 capitalize">{formatDayShort(day)}</div>
          ))}
          <div className="relative" style={{ height: 720 }}>
            {Array.from({ length: 12 }, (_, hour) => (
              <div key={hour} className="absolute left-0 text-[11px] text-slate-400" style={{ top: (hour / 12) * 720 - 6 }}>
                {String(8 + hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div
              key={day}
              className="relative bg-white rounded-lg border border-slate-200"
              style={{ height: 720 }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => dropOn(day, event)}
            >
              {Array.from({ length: 12 }, (_, hour) => (
                <div key={hour} className="absolute inset-x-0 border-t border-slate-100" style={{ top: (hour / 12) * 720 }} />
              ))}
              {items
                .filter((item) => parisDateKey(new Date(item.starts_at)) === day)
                .map((item) => {
                  const startMin = parisMinutes(item.starts_at);
                  const dur = Math.max(15, (new Date(item.ends_at).getTime() - new Date(item.starts_at).getTime()) / 60_000);
                  const top = ((startMin - START) / SPAN) * 100;
                  const height = (dur / SPAN) * 100;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
                      onClick={() => setSelected(item.id)}
                      className={`absolute inset-x-1 rounded-md px-1.5 py-1 text-left overflow-hidden ${tone(item)} ${selected === item.id ? "ring-2 ring-brand-400" : ""}`}
                      style={{ top: `${Math.max(0, top)}%`, height: `${Math.max(height, 4)}%` }}
                    >
                      <span className="block text-[11px] font-semibold truncate">{item.status === "blocked" ? item.service_name || "Bloqué" : item.client_name}</span>
                      <span className="block text-[10px] truncate opacity-80">{formatTime(item.starts_at)} · {item.service_name}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
      {current ? (
        <form
          key={current.id}
          className="mt-4 flex flex-wrap items-end gap-2 bg-white border border-slate-200 rounded-xl p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const date = String(form.get("date") ?? "");
            const time = String(form.get("time") ?? "");
            const iso = zonedWallTimeToUtc(date, time).toISOString();
            startTransition(async () => {
              const result = await moveAppointment(current.id, iso);
              if (result.error) setError(result.error);
              else router.refresh();
            });
          }}
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">{current.client_name || current.service_name}</p>
            <p className="text-xs text-slate-500">{formatTime(current.starts_at)} – {formatTime(current.ends_at)}</p>
          </div>
          <label className="text-xs text-slate-600">
            Déplacer au
            <input name="date" type="date" required className="mt-1 block h-10 rounded-lg border border-slate-300 px-2 text-sm" defaultValue={parisDateKey(new Date(current.starts_at))} />
          </label>
          <input name="time" type="time" required defaultValue={formatHm(current.starts_at)} className="h-10 rounded-lg border border-slate-300 px-2 text-sm" />
          <button className="h-10 px-3 rounded-lg grad text-white text-sm font-semibold">Déplacer</button>
        </form>
      ) : null}
    </div>
  );
}
