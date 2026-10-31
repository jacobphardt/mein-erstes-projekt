// Erzeugt realistische Beispielflüge. Preise und Flugzeiten richten sich nach der echten
// Entfernung, der Klasse, den Umstiegen und der Tageszeit. Gleiche Suche = gleiche Ergebnisse.

import { getAirport } from "../data/airports.js";
import { AIRLINES, LOWCOST_REGION, HUB_AIRLINES } from "../data/airlines.js";

export const id = "mock";
export const label = "Beispieldaten";
export const live = false;

const CABIN_FACTOR = { economy: 1, premium: 1.75, business: 3.6, first: 6.2 };
const SHORT_HAUL_PLANES = ["Airbus A320neo", "Airbus A321neo", "Boeing 737-800", "Airbus A220-300", "Embraer 195"];
const LONG_HAUL_PLANES = ["Boeing 787-9", "Airbus A350-900", "Boeing 777-300ER", "Airbus A330-300", "Airbus A380"];

export async function searchFlights(query) {
  await delay(500 + Math.random() * 500); // fühlt sich an wie eine echte API

  const from = getAirport(query.from);
  const to = getAirport(query.to);
  if (!from || !to) {
    const missing = !from ? query.from : query.to;
    throw new Error(`Für „${missing}“ gibt es keine Beispieldaten. Wähle einen Flughafen aus der Vorschlagsliste.`);
  }

  const rand = seededRandom(JSON.stringify(query));
  const outbound = generateOptions(from, to, query.departDate, query.cabin, rand);
  const inbound = query.returnDate ? generateOptions(to, from, query.returnDate, query.cabin, rand) : null;
  const passengers = query.adults + query.children * 0.75 + query.infants * 0.1;
  const cabinFactor = CABIN_FACTOR[query.cabin] ?? 1;

  const itineraries = outbound.map((out, index) => {
    let back = null;
    let base = out.basePrice;
    if (inbound) {
      // Bevorzugt Rückflug mit derselben Airline, wie in echten Kombinationen
      const sameAirline = inbound.filter((o) => o.airlineCode === out.airlineCode);
      back = pick(sameAirline.length ? sameAirline : inbound, rand);
      base = (out.basePrice + back.basePrice) * 0.93;
    }
    const airlineCodes = [...new Set([...out.segmentAirlines, ...(back ? back.segmentAirlines : [])])];
    return {
      id: `mock-${index}`,
      price: Math.round(base * passengers * cabinFactor),
      airlines: airlineCodes.map((code) => ({ code, name: AIRLINES[code].name, color: AIRLINES[code].color })),
      outbound: out.leg,
      inbound: back ? back.leg : null,
      returnToken: null,
      bookingUrl: null,
    };
  });

  return { itineraries };
}

export async function getReturnFlights() {
  return { itineraries: [] }; // Beispieldaten enthalten Rückflüge bereits
}

// ---------- Flugverbindungen erzeugen ----------

function generateOptions(from, to, date, cabin, rand) {
  const directKm = distanceKm(from, to);
  const allowLowcost = cabin === "economy" && directKm < 4500 && LOWCOST_REGION.has(from.countryCode) && LOWCOST_REGION.has(to.countryCode);
  const options = [];

  // Direktflüge: Airlines aus Abflug- oder Zielland, auf der Langstrecke nur zwischen großen Flughäfen
  const longHaul = directKm > 4000;
  if (directKm < 14500 && (!longHaul || (from.big && to.big))) {
    let carriers = Object.keys(AIRLINES).filter((code) => {
      const airline = AIRLINES[code];
      if (airline.lowcost) return false;
      return airline.home.includes(from.countryCode) || airline.home.includes(to.countryCode);
    });
    if (allowLowcost) {
      const lowcosts = shuffle(Object.keys(AIRLINES).filter((c) => AIRLINES[c].lowcost), rand);
      carriers = carriers.concat(lowcosts.slice(0, 2 + Math.floor(rand() * 2)));
    }
    for (const code of carriers) {
      const flights = longHaul ? 1 : 1 + Math.floor(rand() * 3);
      for (let i = 0; i < flights; i++) {
        options.push(makeOption([from, to], [code], date, rand, directKm));
      }
    }
  }

  // Umsteigeverbindungen über Drehkreuze, die keinen großen Umweg bedeuten
  const maxDetour = directKm < 1500 ? 1.6 : 1.3;
  const hubs = HUB_AIRLINES
    .map(({ code, hub }) => ({ code, hub: getAirport(hub) }))
    .filter(({ hub }) => hub && hub.code !== from.code && hub.code !== to.code)
    .map((h) => ({ ...h, km1: distanceKm(from, h.hub), km2: distanceKm(h.hub, to) }))
    .filter((h) => h.km1 > 200 && h.km2 > 200 && (h.km1 + h.km2) / directKm < maxDetour)
    .sort((a, b) => a.km1 + a.km2 - (b.km1 + b.km2))
    .slice(0, 7);

  for (const h of hubs) {
    const flights = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < flights; i++) {
      options.push(makeOption([from, h.hub, to], [h.code, h.code], date, rand, directKm));
    }
  }

  // Zwei Umstiege, wenn es sonst wenig Auswahl gibt oder die Strecke sehr lang ist
  if (options.length < 8 || directKm > 9000) {
    for (let a = 0; a < hubs.length; a++) {
      for (let b = 0; b < hubs.length; b++) {
        if (a === b) continue;
        const h1 = hubs[a], h2 = hubs[b];
        const km = h1.km1 + distanceKm(h1.hub, h2.hub) + h2.km2;
        if (km / directKm < 1.35 && rand() < 0.35) {
          options.push(makeOption([from, h1.hub, h2.hub, to], [h1.code, h1.code, h2.code], date, rand, directKm));
        }
      }
    }
  }

  return options.slice(0, 40);
}

function makeOption(path, segmentAirlines, date, rand, directKm) {
  const depMinutes = 6 * 60 + Math.round((rand() * 16.5 * 60) / 5) * 5;
  const start = localToUtc(date, depMinutes, path[0].tz);
  let t = start;
  const segments = [];
  const layovers = [];

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const km = distanceKm(a, b);
    const durationMin = roundTo5((km / 800) * 60 + 30);
    const code = segmentAirlines[i];
    const planes = km > 4000 ? LONG_HAUL_PLANES : SHORT_HAUL_PLANES;
    segments.push({
      airline: AIRLINES[code].name,
      airlineCode: code,
      flightNumber: `${code} ${100 + Math.floor(rand() * 2900)}`,
      aircraft: pick(planes, rand),
      durationMin,
      from: { code: a.code, name: a.name, time: utcToLocal(t, a.tz) },
      to: { code: b.code, name: b.name, time: utcToLocal(t + durationMin * 60000, b.tz) },
    });
    t += durationMin * 60000;

    if (i < path.length - 2) {
      const layoverMin = roundTo5(50 + rand() * 190);
      const arrivalDay = utcToLocal(t, b.tz).slice(0, 10);
      const nextDepartureDay = utcToLocal(t + layoverMin * 60000, b.tz).slice(0, 10);
      layovers.push({ code: b.code, name: b.name, durationMin: layoverMin, overnight: arrivalDay !== nextDepartureDay });
      t += layoverMin * 60000;
    }
  }

  const stops = path.length - 2;
  const mainAirline = AIRLINES[segmentAirlines[segmentAirlines.length - 1]];
  const depHour = Math.floor(depMinutes / 60);
  const price =
    basePrice(directKm) *
    [1, 0.82, 0.74][stops] *
    (mainAirline.lowcost ? 0.62 : 1) *
    (depHour < 7 || depHour >= 21 ? 0.88 : 1) *
    (0.85 + rand() * 0.4);

  return {
    airlineCode: segmentAirlines[0],
    segmentAirlines: [...new Set(segmentAirlines)],
    basePrice: price,
    leg: {
      departure: segments[0].from,
      arrival: segments[segments.length - 1].to,
      durationMin: Math.round((t - start) / 60000),
      stops,
      layovers,
      segments,
    },
  };
}

// Preis pro Erwachsenem und Strecke in Economy
function basePrice(km) {
  return 39 + 0.11 * Math.min(km, 2000) + 0.045 * Math.max(0, km - 2000);
}

// ---------- Hilfsfunktionen ----------

function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function localToUtc(dateStr, minutesOfDay, tz) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d, 0, minutesOfDay) - tz * 3600000;
}

function utcToLocal(ms, tz) {
  return new Date(ms + tz * 3600000).toISOString().slice(0, 16);
}

const roundTo5 = (n) => Math.round(n / 5) * 5;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pick = (list, rand) => list[Math.floor(rand() * list.length)];

function shuffle(list, rand) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Zufallszahlen, die bei gleichem Text immer gleich ausfallen (mulberry32)
function seededRandom(text) {
  let seed = 2166136261;
  for (let i = 0; i < text.length; i++) seed = Math.imul(seed ^ text.charCodeAt(i), 16777619);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
