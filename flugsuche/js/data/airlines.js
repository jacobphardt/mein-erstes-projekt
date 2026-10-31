// Fluggesellschaften für die Beispieldaten.
// home = Heimatländer, hub = Drehkreuz für Umsteigeverbindungen, lowcost = Billigflieger.

export const AIRLINES = {
  LH: { name: "Lufthansa", color: "#05164d", home: ["DE"], hub: "FRA" },
  EW: { name: "Eurowings", color: "#a6005b", home: ["DE"], lowcost: true },
  DE: { name: "Condor", color: "#c99a00", home: ["DE"] },
  LX: { name: "Swiss", color: "#d71920", home: ["CH"], hub: "ZRH" },
  OS: { name: "Austrian Airlines", color: "#c8102e", home: ["AT"], hub: "VIE" },
  AF: { name: "Air France", color: "#002157", home: ["FR"], hub: "CDG" },
  KL: { name: "KLM", color: "#00a1de", home: ["NL"], hub: "AMS" },
  BA: { name: "British Airways", color: "#075aaa", home: ["GB"], hub: "LHR" },
  EI: { name: "Aer Lingus", color: "#008374", home: ["IE"], hub: "DUB" },
  IB: { name: "Iberia", color: "#d7192d", home: ["ES"], hub: "MAD" },
  VY: { name: "Vueling", color: "#b38f00", home: ["ES"], lowcost: true },
  AZ: { name: "ITA Airways", color: "#0a2a5e", home: ["IT"], hub: "FCO" },
  TP: { name: "TAP Air Portugal", color: "#00a94f", home: ["PT"], hub: "LIS" },
  SK: { name: "SAS", color: "#000a8c", home: ["DK", "SE", "NO"], hub: "CPH" },
  AY: { name: "Finnair", color: "#0b1560", home: ["FI"], hub: "HEL" },
  LO: { name: "LOT Polish Airlines", color: "#11397e", home: ["PL"], hub: "WAW" },
  A3: { name: "Aegean Airlines", color: "#1a3c7a", home: ["GR", "CY"], hub: "ATH" },
  TK: { name: "Turkish Airlines", color: "#c70a0c", home: ["TR"], hub: "IST" },
  PC: { name: "Pegasus", color: "#d18f00", home: ["TR"], lowcost: true },
  FR: { name: "Ryanair", color: "#073590", home: ["IE"], lowcost: true },
  U2: { name: "easyJet", color: "#ff6600", home: ["GB", "CH"], lowcost: true },
  W6: { name: "Wizz Air", color: "#c6007e", home: ["HU", "PL"], lowcost: true },
  EK: { name: "Emirates", color: "#d71921", home: ["AE"], hub: "DXB" },
  EY: { name: "Etihad", color: "#a77c12", home: ["AE"], hub: "AUH" },
  QR: { name: "Qatar Airways", color: "#5c0632", home: ["QA"], hub: "DOH" },
  MS: { name: "EgyptAir", color: "#00265d", home: ["EG"], hub: "CAI" },
  LY: { name: "El Al", color: "#0c2c84", home: ["IL"] },
  AT: { name: "Royal Air Maroc", color: "#c4122f", home: ["MA"] },
  AI: { name: "Air India", color: "#da291c", home: ["IN"], hub: "DEL" },
  TG: { name: "Thai Airways", color: "#4b0f6b", home: ["TH"], hub: "BKK" },
  SQ: { name: "Singapore Airlines", color: "#1d2a5b", home: ["SG"], hub: "SIN" },
  CX: { name: "Cathay Pacific", color: "#006564", home: ["HK"], hub: "HKG" },
  CA: { name: "Air China", color: "#e30613", home: ["CN"], hub: "PEK" },
  NH: { name: "ANA", color: "#13448f", home: ["JP"], hub: "HND" },
  JL: { name: "Japan Airlines", color: "#cc0000", home: ["JP"] },
  KE: { name: "Korean Air", color: "#0080c0", home: ["KR"], hub: "ICN" },
  GA: { name: "Garuda Indonesia", color: "#008aa8", home: ["ID"] },
  QF: { name: "Qantas", color: "#e40000", home: ["AU"], hub: "SYD" },
  UA: { name: "United Airlines", color: "#005daa", home: ["US"], hub: "EWR" },
  DL: { name: "Delta Air Lines", color: "#c8102e", home: ["US"], hub: "ATL" },
  AA: { name: "American Airlines", color: "#0078d2", home: ["US"], hub: "DFW" },
  AC: { name: "Air Canada", color: "#d22630", home: ["CA"], hub: "YYZ" },
  AM: { name: "Aeroméxico", color: "#0b2343", home: ["MX"], hub: "MEX" },
  LA: { name: "LATAM", color: "#1b0088", home: ["BR", "AR"], hub: "GRU" },
  SA: { name: "South African Airways", color: "#0d47a1", home: ["ZA"], hub: "JNB" },
  KQ: { name: "Kenya Airways", color: "#b0102a", home: ["KE"], hub: "NBO" },
  MK: { name: "Air Mauritius", color: "#e31837", home: ["MU"] },
};

// Länder, in denen Billigflieger unterwegs sind
export const LOWCOST_REGION = new Set([
  "DE", "AT", "CH", "GB", "IE", "FR", "NL", "BE", "DK", "SE", "NO", "FI", "PL", "CZ", "HU",
  "ES", "PT", "IT", "GR", "HR", "CY", "TR", "MA", "IL",
]);

export const HUB_AIRLINES = Object.entries(AIRLINES)
  .filter(([, a]) => a.hub)
  .map(([code, a]) => ({ code, hub: a.hub }));
