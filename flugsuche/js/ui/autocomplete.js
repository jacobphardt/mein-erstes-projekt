import { searchAirports, getAirport } from "../api/flightService.js";
import { escapeHtml } from "../utils/format.js";

let counter = 0;

/**
 * Macht aus einem Textfeld eine Flughafensuche mit Vorschlägen.
 * Gibt { getCode, setAirport, input } zurück.
 */
export function createAirportInput(input, { onChange } = {}) {
  const listId = `ac-list-${++counter}`;
  const list = document.createElement("ul");
  list.className = "ac-list";
  list.id = listId;
  list.setAttribute("role", "listbox");
  list.hidden = true;
  input.after(list);

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", listId);
  input.setAttribute("aria-expanded", "false");

  let selected = null; // gewählter Flughafen { code, city, name, ... }
  let matches = [];
  let active = -1;

  function label(airport) {
    return `${airport.city} (${airport.code})`;
  }

  function open(items) {
    matches = items;
    active = items.length ? 0 : -1;
    if (!items.length) {
      list.innerHTML = `<li class="ac-empty">Kein Flughafen gefunden. Du kannst auch einen 3-Buchstaben-Code eingeben.</li>`;
    } else {
      list.innerHTML = items
        .map(
          (a, i) => `<li class="ac-item" role="option" id="${listId}-${i}" data-index="${i}" aria-selected="${i === active}">
            <span class="ac-code">${a.code}</span>
            <span class="ac-text"><strong>${escapeHtml(a.city)}</strong><small>${escapeHtml(a.name)}, ${escapeHtml(a.country)}</small></span>
          </li>`,
        )
        .join("");
    }
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    updateActive();
  }

  function close() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }

  function updateActive() {
    list.querySelectorAll(".ac-item").forEach((el, i) => el.setAttribute("aria-selected", String(i === active)));
    if (active >= 0) {
      input.setAttribute("aria-activedescendant", `${listId}-${active}`);
      list.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
    }
  }

  function choose(airport) {
    selected = airport;
    input.value = airport ? label(airport) : "";
    input.classList.remove("is-invalid");
    close();
    onChange?.(airport);
  }

  input.addEventListener("input", () => {
    selected = null;
    const term = input.value.trim();
    if (!term) return close();
    open(searchAirports(term));
  });

  input.addEventListener("focus", () => input.select());

  input.addEventListener("keydown", (event) => {
    if (list.hidden) {
      if (event.key === "ArrowDown" && input.value.trim()) open(searchAirports(input.value));
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      active = Math.min(active + 1, matches.length - 1);
      updateActive();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      active = Math.max(active - 1, 0);
      updateActive();
    } else if (event.key === "Enter") {
      if (active >= 0) {
        event.preventDefault();
        choose(matches[active]);
      }
    } else if (event.key === "Escape") {
      close();
    }
  });

  // mousedown statt click, damit das Feld den Fokus nicht vorher verliert
  list.addEventListener("mousedown", (event) => {
    const item = event.target.closest(".ac-item");
    if (!item) return;
    event.preventDefault();
    choose(matches[Number(item.dataset.index)]);
  });

  input.addEventListener("blur", () => {
    // Bei Verlassen des Feldes den besten Treffer übernehmen
    if (!selected && input.value.trim() && matches.length && !list.hidden) choose(matches[Math.max(active, 0)]);
    close();
  });

  return {
    input,
    /** IATA-Code des gewählten Flughafens oder ein direkt eingegebener 3-Buchstaben-Code */
    getCode() {
      if (selected) return selected.code;
      const raw = input.value.trim().toUpperCase();
      const code = raw.match(/\(([A-Z]{3})\)$/)?.[1] || raw;
      return /^[A-Z]{3}$/.test(code) ? code : null;
    },
    setAirport(codeOrAirport) {
      const airport = typeof codeOrAirport === "string" ? getAirport(codeOrAirport) : codeOrAirport;
      if (!airport && typeof codeOrAirport === "string") {
        // Code, der nicht in unserer Liste steht (z. B. für die echte API)
        selected = null;
        input.value = codeOrAirport;
        return;
      }
      choose(airport);
    },
    getAirport() {
      return selected;
    },
  };
}
