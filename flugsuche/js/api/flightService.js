// Einheitliche Schnittstelle zwischen Oberfläche und Datenquelle.
// Die Oberfläche spricht nur mit diesen Funktionen. Welcher Provider dahinter steckt,
// entscheidet CONFIG.provider. Ein neuer Anbieter braucht nur eine Datei mit
// denselben Exporten wie mockProvider.js.
//
// Suchanfrage (query):
//   { from: "FRA", to: "JFK", departDate: "2026-11-20", returnDate: "2026-11-27" | null,
//     adults: 1, children: 0, infants: 0, cabin: "economy" | "premium" | "business" | "first" }
//
// Ergebnis: { itineraries: Itinerary[], insights?: { level, typicalRange: [min, max] } }
//
// Itinerary:
//   { id, price,                         // Gesamtpreis für alle Reisenden
//     airlines: [{ name, code, logo?, color? }],
//     outbound: Leg, inbound: Leg | null,
//     returnToken: string | null,        // Rückflüge werden nachgeladen (SerpApi)
//     bookingUrl: string | null }
//
// Leg:
//   { departure: { code, name, time }, arrival: { code, name, time },   // time = "YYYY-MM-DDTHH:mm" (Ortszeit)
//     durationMin, stops, layovers: [{ code, name, durationMin, overnight }],
//     segments: [{ airline, airlineCode, flightNumber, aircraft, durationMin, from, to }] }

import { CONFIG } from "../config.js";
import * as mockProvider from "./mockProvider.js";
import * as serpapiProvider from "./serpapiProvider.js";

let providerPromise = null;

async function resolveProvider() {
  if (CONFIG.provider === "mock") return mockProvider;
  if (CONFIG.provider === "serpapi") return serpapiProvider;
  try {
    const response = await fetch("/api/status");
    const status = await response.json();
    return status.live ? serpapiProvider : mockProvider;
  } catch {
    return mockProvider; // z. B. wenn die Seite ohne server.py läuft
  }
}

function getProvider() {
  providerPromise ??= resolveProvider();
  return providerPromise;
}

export async function getProviderInfo() {
  const provider = await getProvider();
  return { id: provider.id, label: provider.label, live: provider.live };
}

export async function searchFlights(query) {
  const provider = await getProvider();
  return provider.searchFlights(query);
}

/** Lädt die Rückflüge zu einem gewählten Hinflug (nur nötig, wenn returnToken gesetzt ist). */
export async function getReturnFlights(query, returnToken) {
  const provider = await getProvider();
  return provider.getReturnFlights(query, returnToken);
}

export { searchAirports, getAirport } from "../data/airports.js";
