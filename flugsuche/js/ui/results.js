import { formatPrice, formatDuration, formatTime, formatDate, formatStops, dayOffset, escapeHtml } from "../utils/format.js";

export const SORTS = {
  price: { label: "Günstigste", compare: (a, b) => a.price - b.price || totalDuration(a) - totalDuration(b) },
  duration: { label: "Schnellste", compare: (a, b) => totalDuration(a) - totalDuration(b) || a.price - b.price },
  departure: { label: "Früheste", compare: (a, b) => a.outbound.departure.time.localeCompare(b.outbound.departure.time) || a.price - b.price },
};

export function totalDuration(itinerary) {
  return itinerary.outbound.durationMin + (itinerary.inbound ? itinerary.inbound.durationMin : 0);
}

/** Ermittelt den günstigsten und schnellsten Flug einer Liste. */
export function findHighlights(list) {
  if (!list.length) return { cheapestId: null, fastestId: null };
  const cheapest = list.reduce((best, i) => SORTS.price.compare(i, best) < 0 ? i : best);
  const fastest = list.reduce((best, i) => SORTS.duration.compare(i, best) < 0 ? i : best);
  return { cheapestId: cheapest.id, fastestId: fastest.id };
}

export function renderSortTabs(container, list, activeSort) {
  const info = {
    price: list.length ? formatPrice(Math.min(...list.map((i) => i.price))) : "–",
    duration: list.length ? formatDuration(Math.min(...list.map(totalDuration))) : "–",
    departure: list.length ? `ab ${formatTime([...list].sort(SORTS.departure.compare)[0].outbound.departure.time)}` : "–",
  };
  container.innerHTML = Object.entries(SORTS)
    .map(
      ([key, sort]) => `<button type="button" class="sort-tab" role="tab" data-sort="${key}" aria-selected="${key === activeSort}">
        <strong>${sort.label}</strong><span>${info[key]}</span>
      </button>`,
    )
    .join("");
}

export function renderLoading(container, query) {
  container.innerHTML = `
    <p class="loading-text">Suche Flüge von ${escapeHtml(query.from)} nach ${escapeHtml(query.to)} …</p>
    ${'<div class="skeleton"></div>'.repeat(4)}`;
}

export function renderMessage(container, { icon = "🔍", title, text = "", error = false, action = null }) {
  container.innerHTML = `
    <div class="message ${error ? "is-error" : ""}">
      <div class="message-icon" aria-hidden="true">${icon}</div>
      <h3>${escapeHtml(title)}</h3>
      ${text ? `<p>${escapeHtml(text)}</p>` : ""}
      ${action ? `<button type="button" class="btn-secondary" data-action="${action.id}">${escapeHtml(action.label)}</button>` : ""}
    </div>`;
}

/**
 * Zeichnet die Flugkarten.
 * context: { query, cheapestId, fastestId }
 */
export function renderResults(container, list, context) {
  container.innerHTML = list.map((itinerary) => cardHtml(itinerary, context)).join("");
}

function passengerCount(query) {
  return query.adults + query.children + query.infants;
}

function cardHtml(itinerary, { query, cheapestId, fastestId }) {
  const isCheapest = itinerary.id === cheapestId;
  const isFastest = itinerary.id === fastestId;
  const classes = ["flight-card", isCheapest && "is-cheapest", isFastest && "is-fastest"].filter(Boolean).join(" ");
  const badges = [
    isCheapest && `<span class="badge badge-cheap">💰 Günstigster</span>`,
    isFastest && `<span class="badge badge-fast">⚡ Schnellster</span>`,
  ].filter(Boolean);

  const people = passengerCount(query);
  const roundTrip = Boolean(query.returnDate);
  const priceNote = [
    roundTrip ? "Hin & Rück" : "Nur Hinflug",
    people > 1 ? `gesamt für ${people} Reisende` : null,
  ].filter(Boolean).join(" · ");
  const payingPeople = query.adults + query.children;

  const actions = [];
  if (itinerary.returnToken) {
    actions.push(`<button type="button" class="btn-small outline" data-action="returns" data-id="${escapeHtml(itinerary.id)}">Rückflüge</button>`);
  }
  if (itinerary.bookingUrl) {
    actions.push(`<a class="btn-small" href="${escapeHtml(itinerary.bookingUrl)}" target="_blank" rel="noopener">Zum Angebot</a>`);
  }

  return `
    <article class="${classes}" data-id="${escapeHtml(itinerary.id)}">
      ${badges.length ? `<div class="badges">${badges.join("")}</div>` : ""}
      <div class="card-main">
        <div class="legs">
          ${legHtml(itinerary.outbound, itinerary, roundTrip ? "Hin" : null)}
          ${itinerary.inbound ? legHtml(itinerary.inbound, itinerary, "Rück") : ""}
        </div>
        <div class="price-box">
          <div>
            <div class="price">${itinerary.returnToken ? '<small class="price-sub">ab </small>' : ""}${formatPrice(itinerary.price)}</div>
            <div class="price-sub">${priceNote}</div>
            ${people > 1 && payingPeople > 0 ? `<div class="price-sub">ca. ${formatPrice(itinerary.price / payingPeople)} p. P.</div>` : ""}
          </div>
          ${actions.length ? `<div class="price-actions">${actions.join("")}</div>` : ""}
        </div>
      </div>
      <div class="returns" hidden></div>
      <details class="card-details">
        <summary>Flugdetails</summary>
        <div class="details-body">
          ${detailsHtml(itinerary.outbound, roundTrip ? `Hinflug · ${formatDate(itinerary.outbound.departure.time.slice(0, 10))}` : formatDate(itinerary.outbound.departure.time.slice(0, 10)))}
          ${itinerary.inbound ? detailsHtml(itinerary.inbound, `Rückflug · ${formatDate(itinerary.inbound.departure.time.slice(0, 10))}`) : ""}
        </div>
      </details>
    </article>`;
}

function airlineMark(airline) {
  if (airline.logo) return `<img class="airline-logo" src="${escapeHtml(airline.logo)}" alt="" loading="lazy">`;
  return `<span class="airline-mark" style="background:${escapeHtml(airline.color || "#5d6680")}" aria-hidden="true">${escapeHtml(airline.code || airline.name.slice(0, 2))}</span>`;
}

export function legHtml(leg, itinerary, label) {
  const legAirlines = [...new Set(leg.segments.map((s) => s.airline))];
  const main = itinerary.airlines.find((a) => a.name === legAirlines[0]) || { name: legAirlines[0], code: leg.segments[0].airlineCode };
  const airlineText = legAirlines.length > 1 ? `${legAirlines[0]} + ${legAirlines.length - 1} weitere` : legAirlines[0];
  const offset = dayOffset(leg.departure.time, leg.arrival.time);
  const stopsText = leg.stops === 0 ? "Direkt" : `${formatStops(leg.stops)} · ${leg.layovers.map((l) => l.code).join(", ")}`;
  const dots = leg.layovers.map((_, i) => `<span class="stop-dot" style="left:${((i + 1) / (leg.layovers.length + 1)) * 100}%"></span>`).join("");

  return `
    <div class="leg">
      <div class="leg-airline">
        ${label ? `<span class="leg-label">${label}</span>` : ""}
        <div style="display:flex;align-items:center;gap:8px;min-width:0">${airlineMark(main)}<span title="${escapeHtml(legAirlines.join(", "))}">${escapeHtml(airlineText)}</span></div>
      </div>
      <div class="leg-times">
        <div class="leg-point">
          <span class="leg-time">${formatTime(leg.departure.time)}</span>
          <span class="leg-code" title="${escapeHtml(leg.departure.name)}">${escapeHtml(leg.departure.code)}</span>
        </div>
        <div class="leg-path">
          <span class="leg-duration">${formatDuration(leg.durationMin)}</span>
          <div class="leg-line">${dots}</div>
          <span class="leg-stops ${leg.stops === 0 ? "direct" : ""}">${escapeHtml(stopsText)}</span>
        </div>
        <div class="leg-point arr">
          <span class="leg-time">${formatTime(leg.arrival.time)}${offset > 0 ? `<sup title="Ankunft ${offset} Tag(e) später">+${offset}</sup>` : ""}</span>
          <span class="leg-code" title="${escapeHtml(leg.arrival.name)}">${escapeHtml(leg.arrival.code)}</span>
        </div>
      </div>
    </div>`;
}

function detailsHtml(leg, title) {
  const parts = [];
  leg.segments.forEach((s, i) => {
    parts.push(`
      <div class="segment">
        <span class="segment-time">${formatTime(s.from.time)}</span><span>${escapeHtml(s.from.name)} (${escapeHtml(s.from.code)})</span>
        <span class="segment-info">${escapeHtml([s.airline, s.flightNumber, s.aircraft, formatDuration(s.durationMin)].filter(Boolean).join(" · "))}</span>
        <span class="segment-time">${formatTime(s.to.time)}</span><span>${escapeHtml(s.to.name)} (${escapeHtml(s.to.code)})</span>
      </div>`);
    const layover = leg.layovers[i];
    if (layover) {
      parts.push(`<div class="layover">⏱ ${formatDuration(layover.durationMin)} Aufenthalt in ${escapeHtml(layover.name)}${layover.overnight ? " · über Nacht" : ""}</div>`);
    }
  });
  return `<div class="details-leg"><h4>${escapeHtml(title)}</h4>${parts.join("")}</div>`;
}

/** Zeigt nachgeladene Rückflüge (SerpApi) innerhalb einer Karte. */
export function renderReturnOptions(container, list, itinerary) {
  if (!list.length) {
    container.innerHTML = `<p class="results-sub">Keine Rückflüge zu diesem Hinflug gefunden.</p>`;
    return;
  }
  const sorted = [...list].sort(SORTS.price.compare);
  container.innerHTML = `
    <h4>Rückflüge zu diesem Hinflug (Preis = Hin &amp; Rück gesamt)</h4>
    ${sorted
      .map(
        (r) => `<div class="return-option">
          ${legHtml(r.outbound, r, null)}
          <div style="text-align:right">
            <div class="price">${formatPrice(r.price)}</div>
            ${itinerary.bookingUrl ? `<a class="btn-small" href="${escapeHtml(itinerary.bookingUrl)}" target="_blank" rel="noopener">Zum Angebot</a>` : ""}
          </div>
        </div>`,
      )
      .join("")}`;
}
