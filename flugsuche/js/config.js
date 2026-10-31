export const CONFIG = {
  // Woher kommen die Flüge?
  //   "auto"    – echte Preise über SerpApi, wenn server.py einen Schlüssel hat, sonst Beispieldaten
  //   "mock"    – immer Beispieldaten (spart dein SerpApi-Kontingent)
  //   "serpapi" – immer SerpApi
  provider: "auto",

  currency: "EUR",
  language: "de", // Sprache der Flughafen- und Airline-Namen bei SerpApi
  country: "de", // Land, aus dem gesucht wird (beeinflusst die Preise)
};
