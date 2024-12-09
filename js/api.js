const API_BASE_URL = "https://www.randyconnolly.com/funwebdev/3rd/api/f1";

async function fetchAPI(endpoint) {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`);
  if (!response.ok) throw new Error(`Failed to fetch: ${endpoint}`);
  return await response.json();
}

async function fetchSeasonData(season) {
  const races = await fetchAPI(`races.php?season=${season}`);
  saveToLocalStorage(`season-${season}`, races);
  return races;
}

async function fetchResultsForSeason(season) {
  return await fetchAPI(`results.php?season=${season}`);
}

async function fetchQualifyingForSeason(season) {
  return await fetchAPI(`qualifying.php?season=${season}`);
}

async function fetchDriver(driverId) {
  return await fetchAPI(`drivers.php?id=${driverId}`);
}

async function fetchConstructor(constructorId) {
  return await fetchAPI(`constructors.php?id=${constructorId}`);
}

async function fetchCircuit(circuitId) {
  return await fetchAPI(`circuits.php?id=${circuitId}`);
}
