import { createAirportInput } from "./autocomplete.js";
import { todayIso } from "../utils/format.js";

const MAX_PASSENGERS = 9;

/**
 * Steuert das Suchformular. Ruft onSearch(query) mit einer gültigen Suchanfrage auf.
 * Gibt { submit, setRoute, setBusy } zurück.
 */
export function initSearchForm(form, { onSearch }) {
  const from = createAirportInput(form.querySelector("#from"));
  const to = createAirportInput(form.querySelector("#to"));
  const depart = form.querySelector("#depart");
  const ret = form.querySelector("#return");
  const returnField = form.querySelector("#return-field");
  const cabin = form.querySelector("#cabin");
  const errorBox = form.querySelector("#form-error");
  const submitBtn = form.querySelector(".search-btn");

  const pax = { adults: 1, children: 0, infants: 0 };
  const paxToggle = form.querySelector("#pax-toggle");
  const paxPopover = form.querySelector("#pax-popover");

  // ----- Startwerte -----
  depart.min = todayIso();
  depart.value = todayIso(14);
  ret.min = depart.value;
  ret.value = todayIso(21);
  from.setAirport("FRA");

  // ----- Hin & Rück / Nur Hinflug -----
  const tripType = () => form.querySelector('input[name="tripType"]:checked').value;
  function updateTripType() {
    const oneWay = tripType() === "oneway";
    form.classList.toggle("is-oneway", oneWay);
    returnField.hidden = oneWay;
  }
  form.querySelectorAll('input[name="tripType"]').forEach((r) => r.addEventListener("change", updateTripType));
  updateTripType();

  // ----- Daten: Rückflug nie vor dem Hinflug -----
  depart.addEventListener("change", () => {
    ret.min = depart.value || todayIso();
    if (ret.value && depart.value && ret.value < depart.value) ret.value = depart.value;
  });

  // ----- Tauschen -----
  form.querySelector("#swap-btn").addEventListener("click", () => {
    const a = from.getAirport() || from.getCode() || "";
    const b = to.getAirport() || to.getCode() || "";
    from.setAirport(b);
    to.setAirport(a);
  });

  // ----- Reisende -----
  function paxLabel() {
    const parts = [`${pax.adults} ${pax.adults === 1 ? "Erwachsener" : "Erwachsene"}`];
    if (pax.children) parts.push(`${pax.children} ${pax.children === 1 ? "Kind" : "Kinder"}`);
    if (pax.infants) parts.push(`${pax.infants} ${pax.infants === 1 ? "Baby" : "Babys"}`);
    return parts.join(", ");
  }

  function canChange(type, step) {
    const next = { ...pax, [type]: pax[type] + step };
    const total = next.adults + next.children + next.infants;
    if (next[type] < 0 || next.adults < 1 || total > MAX_PASSENGERS) return false;
    return next.infants <= next.adults; // ein Baby pro Erwachsenem (auf dem Schoß)
  }

  function renderPax() {
    paxToggle.textContent = paxLabel();
    paxPopover.querySelectorAll(".pax-row").forEach((row) => {
      const type = row.dataset.type;
      row.querySelector("output").textContent = pax[type];
      row.querySelector('[data-step="-1"]').disabled = !canChange(type, -1);
      row.querySelector('[data-step="1"]').disabled = !canChange(type, 1);
    });
  }

  paxPopover.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-step]");
    if (!btn) return;
    const type = btn.closest(".pax-row").dataset.type;
    const step = Number(btn.dataset.step);
    if (canChange(type, step)) pax[type] += step;
    // Weniger Erwachsene als Babys? Babys mit reduzieren
    if (pax.infants > pax.adults) pax.infants = pax.adults;
    renderPax();
  });

  function setPaxOpen(open) {
    paxPopover.hidden = !open;
    paxToggle.setAttribute("aria-expanded", String(open));
  }
  paxToggle.addEventListener("click", () => setPaxOpen(paxPopover.hidden));
  form.querySelector("#pax-done").addEventListener("click", () => {
    setPaxOpen(false);
    paxToggle.focus();
  });
  document.addEventListener("click", (event) => {
    if (!paxPopover.hidden && !event.target.closest(".field-pax")) setPaxOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !paxPopover.hidden) {
      setPaxOpen(false);
      paxToggle.focus();
    }
  });
  renderPax();

  // ----- Prüfen & absenden -----
  function showError(message, field) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    if (field) {
      field.classList.add("is-invalid");
      field.focus();
    }
  }

  function buildQuery() {
    errorBox.hidden = true;
    form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

    const fromCode = from.getCode();
    const toCode = to.getCode();
    const oneWay = tripType() === "oneway";

    if (!fromCode) return showError("Bitte wähle einen Abflugort aus der Liste.", from.input);
    if (!toCode) return showError("Bitte wähle einen Zielort aus der Liste.", to.input);
    if (fromCode === toCode) return showError("Abflug- und Zielort dürfen nicht gleich sein.", to.input);
    if (!depart.value) return showError("Bitte wähle ein Hinflugdatum.", depart);
    if (depart.value < todayIso()) return showError("Das Hinflugdatum liegt in der Vergangenheit.", depart);
    if (!oneWay && !ret.value) return showError("Bitte wähle ein Rückflugdatum oder „Nur Hinflug“.", ret);
    if (!oneWay && ret.value < depart.value) return showError("Der Rückflug darf nicht vor dem Hinflug liegen.", ret);

    return {
      from: fromCode,
      to: toCode,
      departDate: depart.value,
      returnDate: oneWay ? null : ret.value,
      adults: pax.adults,
      children: pax.children,
      infants: pax.infants,
      cabin: cabin.value,
    };
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setPaxOpen(false);
    const query = buildQuery();
    if (query) onSearch(query, { from: from.getAirport(), to: to.getAirport() });
  });

  return {
    submit: () => form.requestSubmit(),
    setRoute(fromCode, toCode) {
      from.setAirport(fromCode);
      to.setAirport(toCode);
    },
    setBusy(busy) {
      submitBtn.disabled = busy;
      submitBtn.textContent = busy ? "Suche läuft …" : "Flüge suchen";
    },
  };
}
