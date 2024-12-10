let driversMap = {};
let constructorsMap = {};
let qualifyingData = [];
let resultsData = [];
let raceData = [];
let favorites = {
  drivers: [],
  constructors: [],
  circuits: [],
};

let isAscending = true; 

async function fetchAPI(endpoint) {
  const response = await fetch(
    `https://www.randyconnolly.com/funwebdev/3rd/api/f1/${endpoint}`,
  );
  return await response.json();
}

async function preloadMappings() {
  const driversStored = localStorage.getItem("drivers");
  const constructorsStored = localStorage.getItem("constructors");
  const favoritesStored = localStorage.getItem("favorites");

  if (driversStored && constructorsStored) {
    driversMap = JSON.parse(driversStored);
    constructorsMap = JSON.parse(constructorsStored);
  } else {
    const drivers = await fetchAPI("drivers.php");
    const constructors = await fetchAPI("constructors.php");

    drivers.forEach((d) => {
      driversMap[d.driverId] = {
        forename: d.forename,
        surname: d.surname,
        nationality: d.nationality,
        dob: d.dob,
        url: d.url,
        image: d.image,
      };
    });

    constructors.forEach((c) => {
      constructorsMap[c.constructorId] = {
        name: c.name,
        nationality: c.nationality,
        url: c.url,
      };
    });

    localStorage.setItem("drivers", JSON.stringify(driversMap));
    localStorage.setItem("constructors", JSON.stringify(constructorsMap));
  }

  if (favoritesStored) {
    favorites = JSON.parse(favoritesStored);
  }
}

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

document.addEventListener("DOMContentLoaded", async () => {
  await preloadMappings();

  const homeView = document.querySelector("#home-view");
  const racesView = document.querySelector("#races-view");
  const resultsDetails = document.querySelector("#results-details");
  const racesList = document.querySelector("#races-list");
  const qualifyingDiv = document.querySelector("#qualifying");
  const resultsDiv = document.querySelector("#results");
  const seasonSelect = document.querySelector("#season-select");
  const homeBtn = document.querySelector("#home-btn");
  const favoritesBtn = document.querySelector("#favorites-btn");

  const constructorPopup = document.querySelector("#constructor-popup");
  const constructorNameElem = document.querySelector("#constructor-name");
  const constructorDetailsElem = document.querySelector("#constructor-details");
  const constructorRaceResultsElem = document.querySelector("#constructor-race-results");
  const closeConstructorPopup = document.querySelector("#close-constructor-popup");

  const driverPopup = document.querySelector("#driver-popup");
  const driverNameElem = document.querySelector("#driver-name");
  const driverDetailsElem = document.querySelector("#driver-details");
  const driverRaceResultsElem = document.querySelector("#driver-race-results");
  const driverImageElem = document.querySelector("#driver-image");

  favoritesBtn.addEventListener("click", () => {
    showFavoritesPopup(); 
  });
  
  function showFavoritesPopup() {
    const favoritesPopup = document.createElement("dialog");
    favoritesPopup.id = "favorites-popup";
  
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", () => {
      favoritesPopup.close();
      document.body.removeChild(favoritesPopup);
    });
  
    const favoritesContent = `
  <h2>Favorites</h2>
  <p><strong>Drivers:</strong> ${favorites.drivers.join(", ")}</p> 
  <p><strong>Constructors:</strong> ${favorites.constructors.join(", ")}</p> 
  <p><strong>Circuits:</strong> ${favorites.circuits.join(", ")}</p> 
`;
  
    favoritesPopup.innerHTML = favoritesContent; 
    favoritesPopup.appendChild(closeButton);
  
    document.body.appendChild(favoritesPopup);
    favoritesPopup.showModal();
  }

  homeBtn.addEventListener("click", () => {
    homeView.style.display = "block";
    racesView.style.display = "none";
    resultsDetails.style.display = "none";
  });

  seasonSelect.addEventListener("change", async () => {
    const season = seasonSelect.value;

    const storedRaces = localStorage.getItem(`races-${season}`);
    if (storedRaces) {
      raceData = JSON.parse(storedRaces);
    } else {
      showLoadingAnimation(racesList);
      raceData = await fetchAPI(`races.php?season=${season}`);
      localStorage.setItem(`races-${season}`, JSON.stringify(raceData));
      hideLoadingAnimation(racesList);
    }

    renderRaces(raceData);
  });

  function renderRaces(races) {
    homeView.style.display = "none";
    racesView.style.display = "block";
  
    racesList.innerHTML = "";
  
    races.forEach((race) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${race.round}</td>
        <td>
          <a href="#" class="race-name-link" data-race-id="${race.id}">
            ${race.name} 
            ${favorites.circuits.includes(race.circuit.name) 
                ? '<span class="favorite-star">★</span>'
                : ""} 
          </a>
        </td>
        <td><button class="results-btn" data-race-id="${race.id}">Results</button></td>
      `;
      racesList.appendChild(tr);
    });

    const raceNameLinks = document.querySelectorAll(".race-name-link");
    raceNameLinks.forEach((link) =>
      link.addEventListener("click", async (event) => {
        event.preventDefault();
        const raceId = event.target.getAttribute("data-race-id");
        await openCircuitPopup(raceId);
      }),
    );

    const resultsButtons = document.querySelectorAll(".results-btn");
    resultsButtons.forEach((btn) =>
      btn.addEventListener("click", async (event) => {
        const raceId = event.target.getAttribute("data-race-id");
        await showRaceDetails(raceId);
      }),
    );

    addSortingFunctionality("races-table");
  }

  async function openCircuitPopup(raceId) {
    const race = raceData.find((r) => r.id === parseInt(raceId));

    if (!race || !race.circuit) {
      console.error(`Race or circuit not found for Race ID: ${raceId}`);
      return;
    }

    const storedCircuit = localStorage.getItem(`circuit-${race.circuit.id}`);
    let circuitData;
    if (storedCircuit) {
      circuitData = JSON.parse(storedCircuit);
    } else {
      circuitData = race.circuit;
      localStorage.setItem(`circuit-${race.circuit.id}`, JSON.stringify(circuitData));
    }

    document.querySelector("#circuit-name").textContent = "Circuit Details";

    const circuitImageUrl = circuitData.imageUrl || `https://placehold.co/300x200?text=${circuitData.name}`;
    document.querySelector("#circuit-image").src = circuitImageUrl;
    document.querySelector("#circuit-image").alt = circuitData.name || "Circuit Image";

    const circuitDetailsHTML = `
    <p><strong>Name:</strong> ${circuitData.name || "Unknown"}</p>
    <p><strong>Location:</strong> ${circuitData.location || "Unknown"}</p>
    <p><strong>Country:</strong> ${circuitData.country || "Unknown"}</p> 
    <p>
      <strong>URL:</strong> 
      <a href="${circuitData.url || "#"}" target="_blank" rel="noopener noreferrer">
        ${circuitData.url ? "View Circuit Details" : "No URL Available"} 
      </a>
    </p>
    <button class="favorite-btn" data-circuit-id="${circuitData.id}">
      ${favorites.circuits.includes(circuitData.name) 
          ? "Remove from Favorites"
          : "Add to Favorites"}
    </button>
  `;

  document.querySelector("#circuit-details").innerHTML = circuitDetailsHTML;


    const favoriteBtn = document.querySelector(`#circuit-popup .favorite-btn`);
favoriteBtn.addEventListener("click", () => {
  toggleFavorite("circuit", circuitData.id, circuitData.name);
  favoriteBtn.textContent = favorites.circuits.includes(circuitData.name) 
    ? "Remove from Favorites"
    : "Add to Favorites";
  renderRaces(raceData)
    });

    document.querySelector("#circuit-popup").showModal();
  }

  document.querySelectorAll(".close-popup-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector("#circuit-popup").close();
    });
  });

  async function showRaceDetails(raceId) {
    let filteredQualifying = qualifyingData.filter((q) => q.race.id === parseInt(raceId));
    let filteredResults = resultsData.filter((r) => r.race.id === parseInt(raceId));

    if (filteredQualifying.length === 0) {
      const storedQualifying = localStorage.getItem(`qualifying-${raceId}`);
      if (storedQualifying) {
        filteredQualifying = JSON.parse(storedQualifying);
      } else {
        showLoadingAnimation(qualifyingDiv);
        const fetchedQualifying = await fetchAPI(`qualifying.php?race=${raceId}`);
        localStorage.setItem(`qualifying-${raceId}`, JSON.stringify(fetchedQualifying));
        filteredQualifying = fetchedQualifying;
        hideLoadingAnimation(qualifyingDiv);
      }
      qualifyingData = qualifyingData.concat(filteredQualifying);
    }

    if (filteredResults.length === 0) {
      const storedResults = localStorage.getItem(`results-${raceId}`);
      if (storedResults) {
        filteredResults = JSON.parse(storedResults);
      } else {
        showLoadingAnimation(resultsDiv);
        const fetchedResults = await fetchAPI(`results.php?race=${raceId}`);
        localStorage.setItem(`results-${raceId}`, JSON.stringify(fetchedResults));
        filteredResults = fetchedResults;
        hideLoadingAnimation(resultsDiv);
      }
      resultsData = resultsData.concat(filteredResults);
    }

    filteredQualifying.sort((a, b) => a.position - b.position);
    filteredResults.sort((a, b) => a.position - b.position);

    qualifyingDiv.innerHTML = filteredQualifying.length > 0 ?
      generateQualifyingTable(filteredQualifying) :
      "<p>No Qualifying Data Available</p>";

    resultsDiv.innerHTML = filteredResults.length > 0 ?
      generateResultsTable(filteredResults) :
      "<p>No Race Results Available</p>";

    resultsDetails.style.display = "block";

    addSortingFunctionality("qualifying-table");
    addSortingFunctionality("results-table");
  }

  function generateQualifyingTable(data) {
    let tableHTML = `
      <table id="qualifying-table">
        <thead>
          <tr>
            <th class="sortable-column" data-sort-type="number">Position</th>
            <th class="sortable-column" data-sort-type="string">Driver</th>
            <th class="sortable-column" data-sort-type="string">Constructor</th>
            <th>Q1</th>
            <th>Q2</th>
            <th>Q3</th>
          </tr>
        </thead>
        <tbody>
    `;
  
    data.forEach((q) => {
      const driverName = driversMap[q.driver.id]; 
      const constructorName = constructorsMap[q.constructor.id]; 
  
      tableHTML += `
          <tr>
            <td>${q.position || "-"}</td>
            <td>
              <a href="#" class="driver-link" data-driver-id="${q.driver.id}">
                ${driverName ? driverName.forename + ' ' + driverName.surname : "Unknown Driver"} 
              </a>
            </td>
            <td>
              <a href="#" class="constructor-link" data-constructor-id="${q.constructor.id}">
                ${constructorName ? constructorName.name : "Unknown Constructor"} 
              </a>
            </td>
            <td>${q.q1 || "-"}</td>
            <td>${q.q2 || "-"}</td>
            <td>${q.q3 || "-"}</td>
          </tr>
      `;
    });
  
    tableHTML += `
        </tbody>
      </table>
    `;
  
    return tableHTML;
  }
  
  function generateResultsTable(data) {
    let tableHTML = `
      <table id="results-table">
        <thead>
          <tr>
            <th class="sortable-column" data-sort-type="number">Position</th>
            <th class="sortable-column" data-sort-type="string">Driver</th>
            <th class="sortable-column" data-sort-type="string">Constructor</th>
            <th class="sortable-column" data-sort-type="number">Points</th>
            <th class="sortable-column" data-sort-type="number">Laps</th>
          </tr>
        </thead>
        <tbody>
    `;
  
    data.forEach((r) => {
      const driverName = driversMap[r.driver.id]; 
      const constructorName = constructorsMap[r.constructor.id]; 
  
      tableHTML += `
          <tr>
            <td>${r.position || "-"}</td>
            <td>
              <a href="#" class="driver-link" data-driver-id="${r.driver.id}">
                ${driverName ? driverName.forename + ' ' + driverName.surname : "Unknown Driver"} 
              </a>
            </td>
            <td>
              <a href="#" class="constructor-link" data-constructor-id="${r.constructor.id}">
                ${constructorName ? constructorName.name : "Unknown Constructor"} 
              </a>
            </td>
            <td>${r.points || "-"}</td>
            <td>${r.laps || "-"}</td>
          </tr>
      `;
    });
  
    tableHTML += `
        </tbody>
      </table>
    `;
  
    return tableHTML;
  }

  function showConstructorPopup(constructorId) {
    const constructor = constructorsMap[constructorId];

    if (!constructor) {
      return;
    }

    constructorNameElem.textContent = constructor.name || "Unknown Constructor";

  constructorDetailsElem.innerHTML = `
    Nationality: ${constructor.nationality}<br>
    <a href="${constructor.url || "#"}" target="_blank" rel="noopener noreferrer">
      ${constructor.url ? "View Constructor Details" : "No URL Available"} 
    </a>
    <button class="favorite-btn" data-constructor-id="${constructor.id}">
      ${favorites.constructors.includes(constructor.name)  
          ? "Remove from Favorites"
          : "Add to Favorites"}
    </button>
  `;


    const raceResults = resultsData.filter(
      (result) => result.constructor.id === constructorId,
    );

    raceResults.sort((a, b) => a.race.round - b.race.round);

    constructorRaceResultsElem.innerHTML = raceResults
  .map(
    (result) => `
      <tr>
        <td>${result.race.round}</td> 
        <td>${result.race.name}</td>
        <td>${driversMap[result.driver.id]
            ? driversMap[result.driver.id].forename +
              " " +
              driversMap[result.driver.id].surname
            : "Unknown Driver"}
        </td>
        <td>${result.position || "-"}</td> 
      </tr>
    `,
  )
  .join("");

    if (!document.querySelector("#bottom-close-constructor-popup")) {
      const popupFooter = document.createElement("div");
      popupFooter.classList.add("popup-footer");
      popupFooter.innerHTML = `
            <button id="bottom-close-constructor-popup" class="close-popup-btn">Close</button>
          `;
      constructorPopup.appendChild(popupFooter);

      document
        .querySelector("#bottom-close-constructor-popup")
        .addEventListener("click", () => constructorPopup.close());
    }

    const favoriteBtn = document.querySelector(`#constructor-popup .favorite-btn`);
    favoriteBtn.addEventListener("click", () => {
      toggleFavorite("constructor", constructorId, constructor.name);
      favoriteBtn.textContent = favorites.constructors.includes(constructor.name) 
        ? "Remove from Favorites"
        : "Add to Favorites";
    
    });

    closeConstructorPopup.addEventListener("click", () => constructorPopup.close());

    constructorPopup.showModal();

    addSortingFunctionality("constructor-results-table");
  }

  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("constructor-link")) {
      event.preventDefault();
      const constructorId = parseInt(event.target.getAttribute("data-constructor-id"));
      showConstructorPopup(constructorId);
    }
  });

  function showDriverPopup(driverId) {
    const driver = driversMap[driverId];

    if (!driver) return;

    driverNameElem.textContent = `${driver.forename} ${driver.surname}`;
  driverDetailsElem.innerHTML = `
    Nationality: ${driver.nationality}<br>
    Date of Birth: ${driver.dob}<br>
    <a href="${driver.url || "#"}" target="_blank" rel="noopener noreferrer">
      ${driver.url ? "View Driver Details" : "No URL Available"} 
    </a>
    <button class="favorite-btn" data-driver-id="${driver.driverId}">
      ${favorites.drivers.includes(driver.driverId)
          ? "Remove from Favorites"
          : "Add to Favorites"}
    </button>
  `;

  const driverImageUrl = driver.image || `https://placehold.co/300x200?text=${driver.forename}+${driver.surname}`; 
    driverImageElem.src = driverImageUrl;
    driverImageElem.alt =`${driver.forename} ${driver.surname}`;

    const raceResults = resultsData.filter((result) => result.driver.id === driverId);
    raceResults.sort((a, b) => a.race.round - b.race.round);

    driverRaceResultsElem.innerHTML = raceResults
      .map((result) => `
            <tr>
              <td>${result.race.round}</td>
              <td>${result.race.name}</td>
              <td>${result.position || "-"}</td>
              <td>${result.points || "0"}</td>
            </tr>
          `)
      .join("");

    if (!document.querySelector("#bottom-close-driver-popup")) {
      const popupFooter = document.createElement("div");
      popupFooter.classList.add("popup-footer");
      popupFooter.innerHTML = `
            <button id="bottom-close-driver-popup" class="close-popup-btn">Close</button>
          `;
      driverPopup.appendChild(popupFooter);

      document
        .querySelector("#bottom-close-driver-popup")
        .addEventListener("click", () => driverPopup.close());
    }

    const favoriteBtn = document.querySelector(`#driver-popup .favorite-btn`);
favoriteBtn.addEventListener("click", () => {
  toggleFavorite("driver", driverId, `${driver.forename} ${driver.surname}`);
  favoriteBtn.textContent = favorites.drivers.includes(`${driver.forename} ${driver.surname}`)
    ? "Remove from Favorites"
    : "Add to Favorites";
    });

    const topCloseButton = document.querySelector("#close-driver-popup");
    const bottomCloseButton = document.querySelector("#bottom-close-driver-popup");

    function closePopup() {
      driverPopup.close();
    }

    topCloseButton.removeEventListener("click", closePopup);
    bottomCloseButton.removeEventListener("click", closePopup);

    topCloseButton.addEventListener("click", closePopup);
    bottomCloseButton.addEventListener("click", closePopup);

    driverPopup.showModal();

    addSortingFunctionality("driver-results-table");
  }

  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("driver-link")) {
      event.preventDefault();
      const driverId = parseInt(event.target.getAttribute("data-driver-id"));
      showDriverPopup(driverId);
    }
  });

  function toggleFavorite(type, id, name) {
    if (type === "driver") {
        if (favorites.drivers.includes(name)) {  
            favorites.drivers = favorites.drivers.filter((favName) => favName !== name);
        } else {
            favorites.drivers.push(name); 
        }
    } else if (type === "constructor") {
        if (favorites.constructors.includes(name)) {  
            favorites.constructors = favorites.constructors.filter((favName) => favName !== name);
        } else {
            favorites.constructors.push(name);
        }
    } else if (type === "circuit") {
        if (favorites.circuits.includes(name)) {  
            favorites.circuits = favorites.circuits.filter((favName) => favName !== name);
        } else {
            favorites.circuits.push(name);
        }
    }
    saveFavorites();
}

  function addSortingFunctionality(table) {
    if (!table) return; 
  
    const headers = table.querySelectorAll("th.sortable-column");
  
    headers.forEach((header) => {
      header.addEventListener("click", () => {
        const sortType = header.dataset.sortType;
        const columnIndex = Array.from(header.parentNode.children).indexOf(header);
  
        const tbody = table.querySelector("tbody");
        const rows = Array.from(tbody.querySelectorAll("tr"));
        const data = rows.map((row) => {
          const cell = row.children[columnIndex];
          const cellValue = sortType === "number" ?
            parseInt(cell.textContent) :
            cell.textContent.trim();
          return {
            row: row,
            value: cellValue,
          };
        });
  
        data.sort((a, b) => {
          if (sortType === "number") {
            return isAscending ? a.value - b.value : b.value - a.value;
          } else {
            const comparison = a.value.localeCompare(b.value);
            return isAscending ? comparison : -comparison;
          }
        });
  
        data.forEach((item) => tbody.appendChild(item.row));
  
        isAscending = !isAscending;
      });
    });
  }
  
 
  const myTable = document.querySelector(".my-table"); 
  addSortingFunctionality(myTable);
  

  function showLoadingAnimation(element) {
    element.innerHTML = '<div class="loading">Loading...</div>';
  }

  function hideLoadingAnimation(element) {
    element.innerHTML = '';
  }
});