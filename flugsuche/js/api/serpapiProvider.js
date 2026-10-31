// Echte Flugpreise von Google Flights über SerpApi (https://serpapi.com/google-flights-api).
// Die Anfrage geht an server.py (/api/flights), der den API-Schlüssel ergänzt.
// Jeder Aufruf verbraucht eine Suche aus deinem SerpApi-Kontingent.

import { CONFIG } from "../config.js";

export const id = "serpapi";
export const label = "Live-Preise (Google Flights)";
export const live = true;

const TRAVEL_CLASS = { economy: 1, premium: 2, business: 3, first: 4 };

export async function searchFlights(query) {
  const data = await request(baseParams(query));
  return normalizeResponse(data);
}

export async function getReturnFlights(query, returnToken) {
  const data = await request({ ...baseParams(query), departure_token: returnToken });
  return normalizeResponse(data);
}

function baseParams(query) {
  const params = {
    departure_id: query.from,
    arrival_id: query.to,
    outbound_date: query.departDate,
    type: query.returnDate ? 1 : 2,
    travel_class: TRAVEL_CLASS[query.cabin] ?? 1,
    adults: query.adults,
    children: query.children,
    infants_on_lap: query.infants,
    currency: CONFIG.currency,
    hl: CONFIG.language,
    gl: CONFIG.country,
  };
  if (query.returnDate) params.return_date = query.returnDate;
  return params;
}

async function request(params) {
  let response;
  try {
    response = await fetch(`/api/flights?${new URLSearchParams(params)}`);
  } catch {
    throw new Error("Der lokale Server ist nicht erreichbar. Läuft server.py?");
  }
  const data = await response.json().catch(() => ({}));

  if (data.error) {
    // Google findet nichts → leere Liste statt Fehlermeldung
    if (/hasn't returned any results|no results/i.test(data.error)) return {};
    if (response.status === 401) throw new Error("Der SerpApi-Schlüssel ist ungültig. Prüfe die Datei .env.");
    if (data.limited) throw new Error(data.error); // Suchlimit von server.py
    if (response.status === 429) throw new Error("Dein SerpApi-Kontingent ist aufgebraucht oder du suchst zu schnell hintereinander.");
    throw new Error(`SerpApi: ${data.error}`);
  }
  if (!response.ok) throw new Error(`Die Suche ist fehlgeschlagen (Fehler ${response.status}).`);
  return data;
}

function normalizeResponse(data) {
  const options = [...(data.best_flights || []), ...(data.other_flights || [])];
  const bookingUrl = data.search_metadata?.google_flights_url || null;
  const itineraries = options
    .filter((option) => typeof option.price === "number" && option.flights?.length)
    .map((option, index) => normalizeOption(option, index, bookingUrl));

  const insights = data.price_insights;
  return {
    itineraries,
    insights: insights
      ? { level: insights.price_level || null, typicalRange: insights.typical_price_range || null }
      : null,
  };
}

function normalizeOption(option, index, bookingUrl) {
  const segments = option.flights.map((f) => ({
    airline: f.airline,
    airlineCode: (f.flight_number || "").split(" ")[0],
    logo: f.airline_logo || null,
    flightNumber: f.flight_number || "",
    aircraft: f.airplane || "",
    durationMin: f.duration,
    from: { code: f.departure_airport.id, name: f.departure_airport.name, time: toLocalTime(f.departure_airport.time) },
    to: { code: f.arrival_airport.id, name: f.arrival_airport.name, time: toLocalTime(f.arrival_airport.time) },
  }));
  const layovers = (option.layovers || []).map((l) => ({
    code: l.id,
    name: l.name,
    durationMin: l.duration,
    overnight: Boolean(l.overnight),
  }));

  const airlines = [];
  for (const s of segments) {
    if (!airlines.some((a) => a.name === s.airline)) {
      airlines.push({ name: s.airline, code: s.airlineCode, logo: s.logo });
    }
  }

  return {
    id: `serp-${index}-${option.departure_token || option.booking_token || ""}`.slice(0, 80),
    price: option.price,
    airlines,
    outbound: {
      departure: segments[0].from,
      arrival: segments[segments.length - 1].to,
      durationMin: option.total_duration,
      stops: segments.length - 1,
      layovers,
      segments,
    },
    inbound: null,
    returnToken: option.departure_token || null,
    bookingUrl,
  };
}

// SerpApi liefert "2026-11-20 7:45" → "2026-11-20T07:45"
function toLocalTime(time) {
  const [date, clock = "00:00"] = String(time).split(" ");
  const [h, m] = clock.split(":");
  return `${date}T${h.padStart(2, "0")}:${(m || "00").padStart(2, "0")}`;
}
