import { CONFIG } from "../config.js";

const priceFormat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: CONFIG.currency,
  maximumFractionDigits: 0,
});

export const formatPrice = (amount) => priceFormat.format(amount);

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} Min.`;
  return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
}

/** "2026-11-20T07:45" → "07:45" */
export const formatTime = (localTime) => localTime.slice(11, 16);

/** Anzahl Tage, die die Ankunft nach dem Abflugdatum liegt (für "+1"). */
export function dayOffset(departureTime, arrivalTime) {
  const dep = Date.parse(departureTime.slice(0, 10));
  const arr = Date.parse(arrivalTime.slice(0, 10));
  return Math.round((arr - dep) / 86400000);
}

export function formatDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
}

export function formatStops(stops) {
  if (stops === 0) return "Direkt";
  return stops === 1 ? "1 Umstieg" : `${stops} Umstiege`;
}

export function todayIso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
