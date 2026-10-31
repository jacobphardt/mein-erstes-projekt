import { searchFlights, getReturnFlights, getProviderInfo } from "./api/flightService.js";
import { initSearchForm } from "./ui/searchForm.js";
import { createFilters } from "./ui/filters.js";
import {
  SORTS, findHighlights, renderSortTabs, renderLoading, renderMessage, renderResults, renderReturnOptions,
} from "./ui/results.js";
import { formatDate, formatPrice } from "./utils/format.js";

const $ = (selector) => document.querySelector(selector);

const els = {
  resultsSection: $("#results-section"),
  title: $("#results-title"),
  sub: $("#results-sub"),
  list: $("#results-list"),
  sortTabs: $("#sort-tabs"),
  filtersPanel: $("#filters"),
  filtersBackdrop: $("#filters-backdrop"),
  filtersOpen: $("#filters-open"),
  badge: $("#provider-badge"),
  footerNote: $("#footer-note"),
};

const state = {
  query: null,
  itineraries: [],
  insights: null,
  sortBy: "price",
  requestId: 0,
};

const filters = createFilters($("#filters-body"), { onChange: update });

const form = initSearchForm($("#search-form"), { onSearch: runSearch });

// ---------- Suche ----------

async function runSearch(query, airports) {
  const requestId = ++state.requestId;
  state.query = query;

  els.resultsSection.hidden = false;
  els.title.textContent = routeTitle(query, airports);
  els.sub.textContent = searchSummary(query);
  els.sortTabs.hidden = true;
  els.filtersPanel.hidden = true;
  renderLoading(els.list, query);
  form.setBusy(true);
  els.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const result = await searchFlights(query);
    if (requestId !== state.requestId) return; // inzwischen neue Suche gestartet
    state.itineraries = result.itineraries;
    state.insights = result.insights || null;
    filters.setData(state.itineraries);
    els.filtersPanel.hidden = false;
    els.sortTabs.hidden = false;
    update();
  } catch (error) {
    if (requestId !== state.requestId) return;
    state.itineraries = [];
    els.sortTabs.hidden = true;
    renderMessage(els.list, { icon: "⚠️", title: "Die Suche hat nicht geklappt", text: error.message, error: true });
  } finally {
    if (requestId === state.requestId) form.setBusy(false);
  }
}

function routeTitle(query, { from, to }) {
  const name = (airport, code) => (airport ? `${airport.city} (${code})` : code);
  return `${name(from, query.from)} → ${name(to, query.to)}`;
}

function searchSummary(query) {
  const people = query.adults + query.children + query.infants;
  const cabin = { economy: "Economy", premium: "Premium Economy", business: "Business", first: "First" }[query.cabin];
  const dates = query.returnDate ? `${formatDate(query.departDate)} – ${formatDate(query.returnDate)}` : `${formatDate(query.departDate)}, nur Hinflug`;
  return `${dates} · ${people} ${people === 1 ? "Reisender" : "Reisende"} · ${cabin}`;
}

// ---------- Anzeige aktualisieren (Filter / Sortierung) ----------

function update() {
  const visible = filters.apply(state.itineraries).sort(SORTS[state.sortBy].compare);
  const active = filters.activeCount();

  els.filtersOpen.innerHTML = `Filter${active ? ` <span class="count">${active}</span>` : ""}`;
  $("#filters-apply").textContent = `${visible.length} ${visible.length === 1 ? "Flug" : "Flüge"} anzeigen`;
  els.sub.textContent = `${searchSummary(state.query)} · ${visible.length} von ${state.itineraries.length} Flügen${insightText()}`;

  renderSortTabs(els.sortTabs, visible, state.sortBy);

  if (!state.itineraries.length) {
    els.sortTabs.hidden = true;
    renderMessage(els.list, {
      icon: "🛫",
      title: "Keine Flüge gefunden",
      text: "Für diese Strecke und dieses Datum gibt es keine Verbindungen. Probiere ein anderes Datum oder einen Flughafen in der Nähe.",
    });
    return;
  }
  if (!visible.length) {
    renderMessage(els.list, {
      icon: "🧐",
      title: "Kein Flug passt zu deinen Filtern",
      text: "Lockere die Filter, um wieder Ergebnisse zu sehen.",
      action: { id: "reset-filters", label: "Filter zurücksetzen" },
    });
    return;
  }

  renderResults(els.list, visible, { query: state.query, ...findHighlights(visible) });
}

function insightText() {
  const level = { low: "niedrig", typical: "üblich", high: "hoch" }[state.insights?.level];
  if (!level) return "";
  const range = state.insights.typicalRange;
  return ` · Preisniveau: ${level}${range ? ` (üblich ${formatPrice(range[0])}–${formatPrice(range[1])})` : ""}`;
}

// ---------- Ereignisse ----------

els.sortTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-sort]");
  if (!tab) return;
  state.sortBy = tab.dataset.sort;
  update();
});

els.list.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  if (button.dataset.action === "reset-filters") {
    filters.reset();
    return;
  }

  if (button.dataset.action === "returns") {
    const card = button.closest(".flight-card");
    const box = card.querySelector(".returns");
    if (!box.hidden) {
      box.hidden = true;
      button.textContent = "Rückflüge";
      return;
    }
    const itinerary = state.itineraries.find((i) => i.id === button.dataset.id);
    box.hidden = false;
    if (box.dataset.loaded) {
      button.textContent = "Ausblenden";
      return;
    }
    button.disabled = true;
    box.innerHTML = `<p class="loading-text">Lade Rückflüge …</p>`;
    try {
      const result = await getReturnFlights(state.query, itinerary.returnToken);
      renderReturnOptions(box, result.itineraries, itinerary);
      box.dataset.loaded = "1";
      button.textContent = "Ausblenden";
    } catch (error) {
      box.innerHTML = `<p class="form-error">${error.message}</p>`;
    } finally {
      button.disabled = false;
    }
  }
});

// Filter am Handy als Fenster von unten
function setFiltersOpen(open) {
  els.filtersPanel.classList.toggle("is-open", open);
  els.filtersBackdrop.hidden = !open;
  document.body.style.overflow = open ? "hidden" : "";
}
els.filtersOpen.addEventListener("click", () => setFiltersOpen(true));
$("#filters-close").addEventListener("click", () => setFiltersOpen(false));
$("#filters-apply").addEventListener("click", () => setFiltersOpen(false));
els.filtersBackdrop.addEventListener("click", () => setFiltersOpen(false));
$("#filters-reset").addEventListener("click", () => filters.reset());
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && els.filtersPanel.classList.contains("is-open")) setFiltersOpen(false);
});

// Beliebte Strecken
$("#quick-picks").addEventListener("click", (event) => {
  const button = event.target.closest("[data-from]");
  if (!button) return;
  form.setRoute(button.dataset.from, button.dataset.to);
  form.submit();
});

// Datenquelle anzeigen
getProviderInfo().then((info) => {
  els.badge.textContent = info.live ? "Live-Preise" : "Beispieldaten";
  els.badge.title = info.label;
  els.badge.classList.toggle("is-live", info.live);
  els.badge.hidden = false;
  els.footerNote.textContent = info.live
    ? "Live-Preise von Google Flights über SerpApi, inklusive Steuern und Gebühren für alle Reisenden. Der endgültige Preis steht beim Anbieter."
    : "Hinweis: Es werden Beispieldaten angezeigt. Trage einen SerpApi-Schlüssel in die Datei .env ein, um echte Preise zu sehen.";
});
