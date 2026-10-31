// Flughäfen für die Vorschläge beim Tippen und für die Beispieldaten.
// tz = Zeitverschiebung zu UTC in Stunden (Winterzeit), big = großer Flughafen mit Langstreckenflügen.

const RAW = [
  // Deutschland
  ["FRA", "Frankfurt", "Flughafen Frankfurt", "DE", "Deutschland", 50.033, 8.570, 1, true],
  ["MUC", "München", "Flughafen München", "DE", "Deutschland", 48.354, 11.786, 1, true],
  ["BER", "Berlin", "Flughafen Berlin Brandenburg", "DE", "Deutschland", 52.366, 13.503, 1, true],
  ["HAM", "Hamburg", "Flughafen Hamburg", "DE", "Deutschland", 53.630, 9.988, 1],
  ["DUS", "Düsseldorf", "Flughafen Düsseldorf", "DE", "Deutschland", 51.289, 6.767, 1, true],
  ["CGN", "Köln/Bonn", "Flughafen Köln/Bonn", "DE", "Deutschland", 50.866, 7.143, 1],
  ["STR", "Stuttgart", "Flughafen Stuttgart", "DE", "Deutschland", 48.690, 9.222, 1],
  ["HAJ", "Hannover", "Flughafen Hannover", "DE", "Deutschland", 52.461, 9.685, 1],
  ["NUE", "Nürnberg", "Flughafen Nürnberg", "DE", "Deutschland", 49.499, 11.067, 1],
  ["LEJ", "Leipzig", "Flughafen Leipzig/Halle", "DE", "Deutschland", 51.424, 12.236, 1],
  ["BRE", "Bremen", "Flughafen Bremen", "DE", "Deutschland", 53.047, 8.787, 1],
  ["DRS", "Dresden", "Flughafen Dresden", "DE", "Deutschland", 51.134, 13.767, 1],
  // Österreich & Schweiz
  ["VIE", "Wien", "Flughafen Wien-Schwechat", "AT", "Österreich", 48.110, 16.570, 1, true],
  ["SZG", "Salzburg", "Flughafen Salzburg", "AT", "Österreich", 47.794, 13.004, 1],
  ["INN", "Innsbruck", "Flughafen Innsbruck", "AT", "Österreich", 47.260, 11.344, 1],
  ["ZRH", "Zürich", "Flughafen Zürich", "CH", "Schweiz", 47.458, 8.548, 1, true],
  ["GVA", "Genf", "Flughafen Genf", "CH", "Schweiz", 46.238, 6.109, 1],
  ["BSL", "Basel", "EuroAirport Basel-Mulhouse", "CH", "Schweiz", 47.590, 7.529, 1],
  // Westeuropa
  ["LHR", "London", "London Heathrow", "GB", "Großbritannien", 51.470, -0.454, 0, true],
  ["LGW", "London", "London Gatwick", "GB", "Großbritannien", 51.148, -0.190, 0, true],
  ["STN", "London", "London Stansted", "GB", "Großbritannien", 51.885, 0.235, 0],
  ["MAN", "Manchester", "Flughafen Manchester", "GB", "Großbritannien", 53.354, -2.275, 0, true],
  ["EDI", "Edinburgh", "Flughafen Edinburgh", "GB", "Großbritannien", 55.950, -3.373, 0],
  ["DUB", "Dublin", "Flughafen Dublin", "IE", "Irland", 53.421, -6.270, 0, true],
  ["CDG", "Paris", "Paris Charles de Gaulle", "FR", "Frankreich", 49.010, 2.548, 1, true],
  ["ORY", "Paris", "Paris Orly", "FR", "Frankreich", 48.723, 2.379, 1],
  ["NCE", "Nizza", "Flughafen Nizza Côte d'Azur", "FR", "Frankreich", 43.658, 7.216, 1],
  ["LYS", "Lyon", "Flughafen Lyon-Saint Exupéry", "FR", "Frankreich", 45.726, 5.091, 1],
  ["AMS", "Amsterdam", "Amsterdam Schiphol", "NL", "Niederlande", 52.310, 4.768, 1, true],
  ["BRU", "Brüssel", "Flughafen Brüssel", "BE", "Belgien", 50.901, 4.484, 1, true],
  // Nordeuropa
  ["CPH", "Kopenhagen", "Flughafen Kopenhagen", "DK", "Dänemark", 55.618, 12.656, 1, true],
  ["ARN", "Stockholm", "Stockholm Arlanda", "SE", "Schweden", 59.652, 17.919, 1, true],
  ["OSL", "Oslo", "Oslo Gardermoen", "NO", "Norwegen", 60.194, 11.100, 1],
  ["HEL", "Helsinki", "Flughafen Helsinki-Vantaa", "FI", "Finnland", 60.317, 24.963, 2, true],
  // Osteuropa
  ["WAW", "Warschau", "Warschau Chopin", "PL", "Polen", 52.166, 20.967, 1, true],
  ["KRK", "Krakau", "Flughafen Krakau", "PL", "Polen", 50.078, 19.785, 1],
  ["PRG", "Prag", "Flughafen Prag", "CZ", "Tschechien", 50.101, 14.260, 1],
  ["BUD", "Budapest", "Flughafen Budapest", "HU", "Ungarn", 47.437, 19.256, 1],
  // Südeuropa
  ["MAD", "Madrid", "Madrid-Barajas", "ES", "Spanien", 40.472, -3.561, 1, true],
  ["BCN", "Barcelona", "Flughafen Barcelona-El Prat", "ES", "Spanien", 41.297, 2.078, 1, true],
  ["PMI", "Palma de Mallorca", "Flughafen Palma de Mallorca", "ES", "Spanien", 39.552, 2.739, 1],
  ["AGP", "Málaga", "Flughafen Málaga", "ES", "Spanien", 36.675, -4.499, 1],
  ["ALC", "Alicante", "Flughafen Alicante", "ES", "Spanien", 38.282, -0.558, 1],
  ["IBZ", "Ibiza", "Flughafen Ibiza", "ES", "Spanien", 38.873, 1.373, 1],
  ["TFS", "Teneriffa", "Teneriffa Süd", "ES", "Spanien", 28.044, -16.573, 0],
  ["LPA", "Gran Canaria", "Flughafen Gran Canaria", "ES", "Spanien", 27.932, -15.387, 0],
  ["LIS", "Lissabon", "Flughafen Lissabon", "PT", "Portugal", 38.774, -9.134, 0, true],
  ["OPO", "Porto", "Flughafen Porto", "PT", "Portugal", 41.248, -8.681, 0],
  ["FAO", "Faro", "Flughafen Faro", "PT", "Portugal", 37.014, -7.966, 0],
  ["FCO", "Rom", "Rom Fiumicino", "IT", "Italien", 41.800, 12.239, 1, true],
  ["MXP", "Mailand", "Mailand Malpensa", "IT", "Italien", 45.630, 8.723, 1, true],
  ["VCE", "Venedig", "Flughafen Venedig Marco Polo", "IT", "Italien", 45.505, 12.352, 1],
  ["NAP", "Neapel", "Flughafen Neapel", "IT", "Italien", 40.886, 14.291, 1],
  ["CTA", "Catania", "Flughafen Catania", "IT", "Italien", 37.467, 15.066, 1],
  ["ATH", "Athen", "Flughafen Athen", "GR", "Griechenland", 37.936, 23.947, 2, true],
  ["HER", "Heraklion", "Flughafen Heraklion (Kreta)", "GR", "Griechenland", 35.340, 25.180, 2],
  ["RHO", "Rhodos", "Flughafen Rhodos", "GR", "Griechenland", 36.405, 28.086, 2],
  ["SPU", "Split", "Flughafen Split", "HR", "Kroatien", 43.539, 16.298, 1],
  ["LCA", "Larnaka", "Flughafen Larnaka", "CY", "Zypern", 34.875, 33.625, 2],
  // Türkei, Nahost, Nordafrika
  ["IST", "Istanbul", "Flughafen Istanbul", "TR", "Türkei", 41.275, 28.752, 3, true],
  ["AYT", "Antalya", "Flughafen Antalya", "TR", "Türkei", 36.899, 30.800, 3],
  ["TLV", "Tel Aviv", "Flughafen Ben Gurion", "IL", "Israel", 32.011, 34.887, 2, true],
  ["CAI", "Kairo", "Flughafen Kairo", "EG", "Ägypten", 30.122, 31.406, 2, true],
  ["HRG", "Hurghada", "Flughafen Hurghada", "EG", "Ägypten", 27.178, 33.799, 2],
  ["RAK", "Marrakesch", "Flughafen Marrakesch-Menara", "MA", "Marokko", 31.607, -8.036, 1],
  ["DXB", "Dubai", "Dubai International", "AE", "Vereinigte Arabische Emirate", 25.253, 55.366, 4, true],
  ["AUH", "Abu Dhabi", "Flughafen Abu Dhabi", "AE", "Vereinigte Arabische Emirate", 24.433, 54.651, 4, true],
  ["DOH", "Doha", "Hamad International", "QA", "Katar", 25.273, 51.608, 3, true],
  // Asien & Ozeanien
  ["DEL", "Delhi", "Indira Gandhi International", "IN", "Indien", 28.556, 77.100, 5.5, true],
  ["BOM", "Mumbai", "Chhatrapati Shivaji International", "IN", "Indien", 19.089, 72.868, 5.5, true],
  ["MLE", "Malé", "Velana International (Malediven)", "MV", "Malediven", 4.192, 73.529, 5, true],
  ["BKK", "Bangkok", "Bangkok Suvarnabhumi", "TH", "Thailand", 13.690, 100.750, 7, true],
  ["HKT", "Phuket", "Flughafen Phuket", "TH", "Thailand", 8.113, 98.317, 7],
  ["SIN", "Singapur", "Singapore Changi", "SG", "Singapur", 1.364, 103.991, 8, true],
  ["DPS", "Bali", "Ngurah Rai International (Denpasar)", "ID", "Indonesien", -8.748, 115.167, 8],
  ["HKG", "Hongkong", "Hong Kong International", "HK", "Hongkong", 22.308, 113.918, 8, true],
  ["PEK", "Peking", "Beijing Capital", "CN", "China", 40.080, 116.585, 8, true],
  ["PVG", "Shanghai", "Shanghai Pudong", "CN", "China", 31.143, 121.805, 8, true],
  ["ICN", "Seoul", "Incheon International", "KR", "Südkorea", 37.460, 126.440, 9, true],
  ["HND", "Tokio", "Tokio Haneda", "JP", "Japan", 35.552, 139.780, 9, true],
  ["KIX", "Osaka", "Kansai International", "JP", "Japan", 34.427, 135.244, 9, true],
  ["SYD", "Sydney", "Sydney Kingsford Smith", "AU", "Australien", -33.940, 151.175, 11, true],
  ["MEL", "Melbourne", "Flughafen Melbourne", "AU", "Australien", -37.670, 144.843, 11, true],
  // Nordamerika
  ["JFK", "New York", "John F. Kennedy International", "US", "USA", 40.641, -73.778, -5, true],
  ["EWR", "New York", "Newark Liberty International", "US", "USA", 40.690, -74.174, -5, true],
  ["BOS", "Boston", "Boston Logan", "US", "USA", 42.366, -71.010, -5, true],
  ["IAD", "Washington", "Washington Dulles", "US", "USA", 38.953, -77.456, -5, true],
  ["MIA", "Miami", "Miami International", "US", "USA", 25.793, -80.290, -5, true],
  ["ATL", "Atlanta", "Hartsfield-Jackson Atlanta", "US", "USA", 33.640, -84.427, -5, true],
  ["ORD", "Chicago", "Chicago O'Hare", "US", "USA", 41.974, -87.907, -6, true],
  ["DFW", "Dallas", "Dallas/Fort Worth", "US", "USA", 32.900, -97.040, -6, true],
  ["DEN", "Denver", "Denver International", "US", "USA", 39.856, -104.674, -7, true],
  ["LAS", "Las Vegas", "Harry Reid International", "US", "USA", 36.084, -115.154, -8, true],
  ["LAX", "Los Angeles", "Los Angeles International", "US", "USA", 33.942, -118.408, -8, true],
  ["SFO", "San Francisco", "San Francisco International", "US", "USA", 37.621, -122.379, -8, true],
  ["YYZ", "Toronto", "Toronto Pearson", "CA", "Kanada", 43.677, -79.624, -5, true],
  ["YVR", "Vancouver", "Vancouver International", "CA", "Kanada", 49.195, -123.180, -8, true],
  ["CUN", "Cancún", "Flughafen Cancún", "MX", "Mexiko", 21.037, -86.877, -5, true],
  ["MEX", "Mexiko-Stadt", "Benito Juárez International", "MX", "Mexiko", 19.436, -99.072, -6, true],
  // Südamerika & Afrika
  ["GRU", "São Paulo", "São Paulo-Guarulhos", "BR", "Brasilien", -23.435, -46.473, -3, true],
  ["EZE", "Buenos Aires", "Buenos Aires Ezeiza", "AR", "Argentinien", -34.822, -58.536, -3, true],
  ["CPT", "Kapstadt", "Cape Town International", "ZA", "Südafrika", -33.965, 18.602, 2, true],
  ["JNB", "Johannesburg", "O. R. Tambo International", "ZA", "Südafrika", -26.139, 28.246, 2, true],
  ["NBO", "Nairobi", "Jomo Kenyatta International", "KE", "Kenia", -1.319, 36.928, 3, true],
  ["MRU", "Mauritius", "Sir Seewoosagur Ramgoolam International", "MU", "Mauritius", -20.430, 57.683, 4, true],
];

export const AIRPORTS = RAW.map(([code, city, name, countryCode, country, lat, lon, tz, big = false]) => ({
  code, city, name, countryCode, country, lat, lon, tz, big,
}));

const BY_CODE = new Map(AIRPORTS.map((a) => [a.code, a]));

export function getAirport(code) {
  return BY_CODE.get(String(code || "").toUpperCase()) || null;
}

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Gleiche Schreibweise für "München", "Muenchen" und "Munchen"
function variants(text) {
  const n = normalize(text);
  return [n, n.replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u")];
}

/** Sucht Flughäfen nach IATA-Code, Stadt, Flughafenname oder Land. */
export function searchAirports(term, limit = 8) {
  const [q, qAlt] = variants(term.trim());
  if (!q) return [];

  const scored = [];
  for (const airport of AIRPORTS) {
    const code = airport.code.toLowerCase();
    const city = variants(airport.city);
    const name = variants(airport.name);
    const country = variants(airport.country);
    const starts = (list) => list.some((v) => v.startsWith(q) || v.startsWith(qAlt));
    const has = (list) => list.some((v) => v.includes(q) || v.includes(qAlt));

    let score = 0;
    if (code === q) score = 100;
    else if (starts(city)) score = 80;
    else if (code.startsWith(q)) score = 70;
    else if (starts(name)) score = 60;
    else if (has(city)) score = 45;
    else if (starts(country)) score = 35;
    else if (has(name)) score = 25;
    if (score) scored.push({ airport, score: score + (airport.big ? 2 : 0) });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.airport.city.localeCompare(b.airport.city, "de"))
    .slice(0, limit)
    .map((s) => s.airport);
}
