# Flugfinder

Eine Flugsuche, die die günstigsten Flüge anzeigt. Ohne Schlüssel läuft sie mit realistischen Beispieldaten, mit SerpApi-Schlüssel mit echten Preisen von Google Flights.

## Starten

Du brauchst nur Python 3. Auf dem Mac ist es schon installiert.

```bash
cd ~/Documents/mein-erstes-projekt/flugsuche
python3 server.py
```

Dann im Browser **http://localhost:8000** öffnen. Beenden mit `Strg + C` im Terminal.

> Ein Doppelklick auf `index.html` reicht nicht: Der Browser lädt die JavaScript-Module nur über einen Server.

## Echte Preise mit SerpApi

1. Auf https://serpapi.com kostenlos registrieren (250 Suchen pro Monat gratis).
2. Den Schlüssel unter https://serpapi.com/manage-api-key kopieren.
3. Im Ordner `flugsuche` die Datei `.env.example` nach `.env` kopieren und den Schlüssel eintragen:
   ```
   SERPAPI_KEY=abc123...
   ```
4. Den Server neu starten (`Strg + C`, dann wieder `python3 server.py`).

Oben rechts steht jetzt **Live-Preise** statt **Beispieldaten**.

### Gut zu wissen

- **Jede Suche kostet eine Anfrage** aus deinem Kontingent. Bei Hin- und Rückflügen kostet auch das Aufklappen der Rückflüge zu einem Hinflug eine Anfrage. Gleiche Suchen merkt sich der Server 30 Minuten lang, die kosten nichts.
- **Der Schlüssel bleibt geheim:** Er steht nur in `.env` und wird von `server.py` an SerpApi angehängt. Der Browser sieht ihn nie, und `.env` ist per `.gitignore` vom Git-Repository ausgeschlossen.
- Willst du trotz Schlüssel Beispieldaten sehen (z. B. beim Basteln am Design), stell in `js/config.js` `provider: "mock"` ein.
- Bei Hin- und Rückflügen zeigt Google Flights zuerst die Hinflüge mit dem günstigsten Gesamtpreis. Über **Rückflüge** lädst du die passenden Rückflüge nach.

## Aufbau

```
flugsuche/
├── server.py                 Lokaler Server + Weiterleitung an SerpApi
├── .env.example              Vorlage für deinen API-Schlüssel
├── index.html
├── css/styles.css            Design, Dunkelmodus, Handy-Layout
└── js/
    ├── app.js                Verbindet Formular, Suche, Filter und Liste
    ├── config.js             Datenquelle wählen (auto / mock / serpapi), Währung
    ├── api/
    │   ├── flightService.js  Einheitliche Schnittstelle + Beschreibung des Datenformats
    │   ├── mockProvider.js   Beispieldaten
    │   └── serpapiProvider.js  Echte Daten von Google Flights
    ├── data/                 Flughäfen (für Vorschläge) und Airlines
    ├── ui/                   Formular, Vorschläge, Filter, Ergebnisliste
    └── utils/format.js       Preise, Zeiten, Dauer auf Deutsch
```

## Eine andere API anschließen

Die Oberfläche spricht nur mit `js/api/flightService.js`. Für einen weiteren Anbieter:

1. Eine neue Datei in `js/api/` anlegen, die `id`, `label`, `live`, `searchFlights(query)` und `getReturnFlights(query, token)` exportiert und Ergebnisse im Format liefert, das oben in `flightService.js` beschrieben ist. `serpapiProvider.js` ist eine gute Vorlage.
2. Den neuen Provider in `flightService.js` einbinden.
3. Falls die API einen geheimen Schlüssel braucht, in `server.py` eine Weiterleitung wie `/api/flights` ergänzen.
