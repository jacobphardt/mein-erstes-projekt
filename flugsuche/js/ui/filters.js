import { formatPrice, escapeHtml } from "../utils/format.js";

export const TIME_SLOTS = [
  { id: "night", label: "Nacht", range: "00–06 Uhr", from: 0, to: 6 },
  { id: "morning", label: "Morgen", range: "06–12 Uhr", from: 6, to: 12 },
  { id: "afternoon", label: "Mittag", range: "12–18 Uhr", from: 12, to: 18 },
  { id: "evening", label: "Abend", range: "18–24 Uhr", from: 18, to: 24 },
];

function timeSlotOf(itinerary) {
  const hour = Number(itinerary.outbound.departure.time.slice(11, 13));
  return TIME_SLOTS.find((s) => hour >= s.from && hour < s.to).id;
}

function emptyState(itineraries) {
  const prices = itineraries.map((i) => i.price);
  return {
    maxPrice: prices.length ? Math.max(...prices) : 0,
    directOnly: false,
    timeSlots: new Set(), // leer = alle Tageszeiten
    excludedAirlines: new Set(),
  };
}

/** Prüft, ob ein Flug zu den Filtern passt. */
function matches(itinerary, state) {
  if (itinerary.price > state.maxPrice) return false;
  if (state.directOnly && (itinerary.outbound.stops > 0 || (itinerary.inbound && itinerary.inbound.stops > 0))) return false;
  if (state.timeSlots.size && !state.timeSlots.has(timeSlotOf(itinerary))) return false;
  if (state.excludedAirlines.size && itinerary.airlines.every((a) => state.excludedAirlines.has(a.name))) return false;
  return true;
}

/**
 * Baut die Filterleiste. onChange() wird bei jeder Änderung aufgerufen.
 * Gibt { setData, apply, reset, activeCount } zurück.
 */
export function createFilters(container, { onChange }) {
  let itineraries = [];
  let bounds = { min: 0, max: 0 };
  let state = emptyState([]);

  function render() {
    if (!itineraries.length) {
      container.innerHTML = `<p class="results-sub">Keine Filter verfügbar.</p>`;
      return;
    }

    const hasDirect = itineraries.some((i) => i.outbound.stops === 0 && (!i.inbound || i.inbound.stops === 0));
    const slotCounts = Object.fromEntries(TIME_SLOTS.map((s) => [s.id, 0]));
    itineraries.forEach((i) => slotCounts[timeSlotOf(i)]++);

    // Airlines mit ihrem günstigsten Preis
    const airlineMin = new Map();
    for (const itinerary of itineraries) {
      for (const airline of itinerary.airlines) {
        const current = airlineMin.get(airline.name);
        if (current === undefined || itinerary.price < current) airlineMin.set(airline.name, itinerary.price);
      }
    }
    const airlines = [...airlineMin.entries()].sort((a, b) => a[1] - b[1]);
    const allChecked = state.excludedAirlines.size === 0;
    const step = Math.max(1, Math.round((bounds.max - bounds.min) / 100));

    container.innerHTML = `
      <div class="filter-group">
        <h3>Höchstpreis <small id="price-value">${formatPrice(state.maxPrice)}</small></h3>
        <input class="range" type="range" id="price-range" min="${bounds.min}" max="${bounds.max}" step="${step}" value="${state.maxPrice}"
               aria-label="Höchstpreis" ${bounds.min === bounds.max ? "disabled" : ""}>
        <div class="range-labels"><span>${formatPrice(bounds.min)}</span><span>${formatPrice(bounds.max)}</span></div>
      </div>

      <div class="filter-group">
        <label class="switch">
          <span>Nur Direktflüge<small>${hasDirect ? "Ohne Umstieg" : "Auf dieser Strecke keine verfügbar"}</small></span>
          <input type="checkbox" id="direct-only" ${state.directOnly ? "checked" : ""} ${hasDirect ? "" : "disabled"}>
        </label>
      </div>

      <div class="filter-group">
        <h3>Abflugzeit Hinflug</h3>
        <div class="time-chips">
          ${TIME_SLOTS.map(
            (s) => `<button type="button" class="time-chip" data-slot="${s.id}" aria-pressed="${state.timeSlots.has(s.id)}" ${slotCounts[s.id] ? "" : "disabled"}>
              <strong>${s.label}</strong><small>${s.range} · ${slotCounts[s.id]}</small>
            </button>`,
          ).join("")}
        </div>
      </div>

      <div class="filter-group">
        <h3>Fluggesellschaften <button type="button" class="link-btn" id="airlines-toggle">${allChecked ? "Keine" : "Alle"}</button></h3>
        <div class="airline-list">
          ${airlines
            .map(
              ([name, price]) => `<label class="airline-option">
                <input type="checkbox" data-airline="${escapeHtml(name)}" ${state.excludedAirlines.has(name) ? "" : "checked"}>
                <span>${escapeHtml(name)}</span><small>ab ${formatPrice(price)}</small>
              </label>`,
            )
            .join("")}
        </div>
      </div>`;
  }

  // Ereignisse einmalig am Container abfangen (Inhalt wird neu gerendert)
  container.addEventListener("input", (event) => {
    if (event.target.id === "price-range") {
      state.maxPrice = Number(event.target.value);
      // Ganz rechts = wirklich alle Preise (der Schieberegler erreicht wegen der Schrittweite evtl. nicht exakt das Maximum)
      if (state.maxPrice > bounds.max - Number(event.target.step)) state.maxPrice = bounds.max;
      container.querySelector("#price-value").textContent = formatPrice(state.maxPrice);
      onChange();
    }
  });

  container.addEventListener("change", (event) => {
    const target = event.target;
    if (target.id === "direct-only") {
      state.directOnly = target.checked;
    } else if (target.dataset.airline) {
      const name = target.dataset.airline;
      if (target.checked) state.excludedAirlines.delete(name);
      else state.excludedAirlines.add(name);
      const toggle = container.querySelector("#airlines-toggle");
      toggle.textContent = state.excludedAirlines.size ? "Alle" : "Keine";
    } else {
      return;
    }
    onChange();
  });

  container.addEventListener("click", (event) => {
    const chip = event.target.closest(".time-chip");
    if (chip) {
      const slot = chip.dataset.slot;
      if (state.timeSlots.has(slot)) state.timeSlots.delete(slot);
      else state.timeSlots.add(slot);
      chip.setAttribute("aria-pressed", String(state.timeSlots.has(slot)));
      onChange();
      return;
    }
    if (event.target.id === "airlines-toggle") {
      const boxes = [...container.querySelectorAll("[data-airline]")];
      const selectAll = state.excludedAirlines.size > 0;
      state.excludedAirlines = selectAll ? new Set() : new Set(boxes.map((b) => b.dataset.airline));
      boxes.forEach((b) => (b.checked = selectAll));
      event.target.textContent = selectAll ? "Keine" : "Alle";
      onChange();
    }
  });

  return {
    setData(newItineraries) {
      itineraries = newItineraries;
      const prices = itineraries.map((i) => i.price);
      bounds = prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 };
      state = emptyState(itineraries);
      render();
    },
    apply(list) {
      return list.filter((i) => matches(i, state));
    },
    reset() {
      state = emptyState(itineraries);
      render();
      onChange();
    },
    activeCount() {
      return (
        (state.maxPrice < bounds.max ? 1 : 0) +
        (state.directOnly ? 1 : 0) +
        (state.timeSlots.size ? 1 : 0) +
        (state.excludedAirlines.size ? 1 : 0)
      );
    },
  };
}
