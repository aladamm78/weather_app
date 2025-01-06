// Constants and Global Variables
const apiKey = '33cb9f56249b616b1d91bed0f095501a'; // OpenWeatherMap API key
const unitToggle = document.getElementById('unitToggle');
const cache = {}; // Cache for city suggestions

const exampleCities = [
    { name: "London", state: "", country: "GB" },
    { name: "New York City", state: "NY", country: "US" },
    { name: "Paris", state: "", country: "FR" },
    { name: "Tokyo", state: "", country: "JP" },
    { name: "Singapore", state: "", country: "SG" },
    { name: "Bangkok", state: "", country: "TH" },
    { name: "Sydney", state: "", country: "AU" },
    { name: "Mexico City", state: "", country: "MX" },
    { name: "Moscow", state: "", country: "RU" }
];

let currentFocus = -1; // Track the currently focused suggestion
let selectedLat = null; // Store selected latitude
let selectedLon = null; // Store selected longitude
let selectedState = ''; // Store selected state
let lastFullName = ''; // Store the last known location name

// DOMContentLoaded Event Listener
// Fetches example weather on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchExampleWeather();
});

// Event Listeners
document.getElementById('getWeather').addEventListener('click', () => {
    if (selectedLat && selectedLon) {
        getWeatherByCoordinates(selectedLat, selectedLon, unitToggle.value, lastFullName);
    } else {
        alert('Please enter or select a city name');
    }
});

document.getElementById('city').addEventListener('input', function () {
    const input = this.value.trim();
    if (input) {
        fetchSuggestions(input);
    } else {
        document.getElementById('suggestions').style.display = 'none';
        toggleLoading(false);
    }
});

document.getElementById('city').addEventListener('keydown', function (event) {
    const suggestionsDiv = document.getElementById('suggestions');
    const items = suggestionsDiv.getElementsByTagName('div');

    if (event.key === 'ArrowDown') {
        currentFocus++;
        if (currentFocus >= items.length) currentFocus = 0;
        setActive(items);
    } else if (event.key === 'ArrowUp') {
        currentFocus--;
        if (currentFocus < 0) currentFocus = items.length - 1;
        setActive(items);
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (currentFocus > -1 && items[currentFocus]) {
            items[currentFocus].click();
        } else {
            const cityInput = document.getElementById('city').value.trim();
            if (cityInput) {
                fetchCoordinatesAndWeather(cityInput, unitToggle.value);
            } else {
                alert('Please enter a city name');
            }
        }
    }
});

unitToggle.addEventListener('change', () => {
    if (selectedLat && selectedLon) {
        const unit = unitToggle.value;
        const fullName = document.getElementById('location').textContent.replace("Weather in ", "");
        getWeatherByCoordinates(selectedLat, selectedLon, unit, fullName);
    }
});

// Helper Functions
function toggleLoading(show) {
    const loadingDiv = document.getElementById('loading');
    if (show) {
        loadingDiv.classList.add('show');
        loadingDiv.textContent = 'Fetching data...';
    } else {
        loadingDiv.classList.remove('show');
        loadingDiv.textContent = '';
    }
}

function setActive(items) {
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('active');
    }
    if (currentFocus >= 0 && items[currentFocus]) {
        items[currentFocus].classList.add('active');
        items[currentFocus].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
}

// Fetching Functions
function fetchSuggestions(input) {
    if (cache[input]) {
        displaySuggestions(cache[input]);
        return;
    }

    const loadingTimer = setTimeout(() => toggleLoading(true), 2000);
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(input)}&limit=10&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            clearTimeout(loadingTimer);
            toggleLoading(false);
            cache[input] = data;
            displaySuggestions(data);
        })
        .catch(error => {
            clearTimeout(loadingTimer);
            toggleLoading(false);
            console.error('Error fetching suggestions:', error);
        });
}

function fetchCoordinatesAndWeather(city, unit) {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=10&appid=${apiKey}`;
    console.log(`Fetching coordinates for: ${city}`);

    toggleLoading(true);
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('City not found');
            return response.json();
        })
        .then(data => {
            toggleLoading(false);
            if (data.length === 0) throw new Error('City not found');

            const { lat, lon, state, country, name } = data[0];
            selectedLat = lat;
            selectedLon = lon;
            selectedState = state || '';
            const fullName = `${name}, ${state ? `${state}, ` : ''}${country}`.trim();

            document.getElementById('city').value = '';
            document.getElementById('suggestions').style.display = 'none';

            getWeatherByCoordinates(lat, lon, unit, fullName);
        })
        .catch(error => {
            toggleLoading(false);
            document.getElementById('weatherDescription').innerHTML = `
                <p class="error-message">${error.message}. Please check the city name or try again later.</p>
            `;
        });
}

function getWeatherByCoordinates(lat, lon, unit, locationName = '') {
    if (!locationName) locationName = lastFullName || 'Unknown location';
    lastFullName = locationName;

    toggleLoading(true);
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;
    console.log(`Fetching weather for lat: ${lat}, lon: ${lon}, unit: ${unit}`);

    fetch(url)
        .then(response => {
            toggleLoading(false);
            if (!response.ok) throw new Error('City not found');
            return response.json();
        })
        .then(data => {
            document.getElementById('weatherDescription').innerHTML = '';
            displayWeather(data, unit, selectedState, locationName);
        })
        .catch(error => {
            toggleLoading(false);
            document.getElementById('weatherDescription').innerHTML = `
                <p class="error-message">${error.message}. Please check the city name or try again later.</p>
            `;
        });
}

function fetchExampleWeather() {
    const exampleWeatherDiv = document.getElementById('exampleWeather');
    exampleWeatherDiv.innerHTML = '';
    const shuffledCities = exampleCities.sort(() => 0.5 - Math.random()).slice(0, 3);

    shuffledCities.forEach(city => {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.name)}&appid=${apiKey}&units=imperial`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const weatherHTML = `
                    <div class="example-weather-item">
                        <h5>${data.name}${city.state ? `, ${city.state}` : ''}, ${city.country}</h5>
                        <img src="http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">
                        <p>${data.weather[0].description}</p>
                        <p>Temp: ${data.main.temp}°F</p>
                    </div>
                `;
                exampleWeatherDiv.innerHTML += weatherHTML;
            })
            .catch(error => {
                console.error(`Error fetching example weather for ${city.name}:`, error);
            });
    });
}

// Display Functions
function displaySuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = '';
    if (suggestions.length > 0) {
        suggestionsDiv.style.display = 'block';
        suggestions.forEach((suggestion) => {
            const div = document.createElement('div');
            const state = suggestion.state ? `${suggestion.state}, ` : '';
            div.textContent = `${suggestion.name}, ${state}${suggestion.country}`;
            div.dataset.city = suggestion.name;
            div.dataset.state = suggestion.state || '';
            div.dataset.country = suggestion.country;
            div.dataset.lat = suggestion.lat;
            div.dataset.lon = suggestion.lon;

            div.addEventListener('click', () => {
                selectedLat = div.dataset.lat;
                selectedLon = div.dataset.lon;
                selectedState = div.dataset.state;
                const fullName = `${div.dataset.city}, ${state}${div.dataset.country}`;
                document.getElementById('city').value = '';
                document.getElementById('suggestions').style.display = 'none';
                getWeatherByCoordinates(selectedLat, selectedLon, unitToggle.value, fullName);
            });

            suggestionsDiv.appendChild(div);
        });
    } else {
        suggestionsDiv.style.display = 'none';
    }
}

function displayWeather(data, unit, state, locationName) {
    const weatherDiv = document.getElementById('weather');
    const weatherIcon = document.getElementById('weatherIcon');
    const locationHeader = document.getElementById('location');
    const temperatureUnit = unit === 'imperial' ? '°F' : '°C';

    locationHeader.textContent = `Weather in ${locationName}`;
    if (data.weather && data.weather[0]) {
        weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
        weatherIcon.alt = data.weather[0].description;
        weatherIcon.style.display = 'block';
    } else {
        weatherIcon.style.display = 'none';
    }

    weatherDiv.innerHTML = `
        <div class="weather-item">
            <p><strong>Temperature:</strong> ${data.main.temp}${temperatureUnit}</p>
            <p><strong>Weather:</strong> ${data.weather[0].description}</p>
            <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
            <p><strong>Wind Speed:</strong> ${data.wind.speed} ${unit === 'imperial' ? 'mph' : 'm/s'}</p>
            <p><strong>Pressure:</strong> ${data.main.pressure} hPa</p>
        </div>
    `;

    document.querySelector('.weather-display').classList.remove('hidden');
    document.getElementById('greeting').style.display = 'none';
    document.getElementById('exampleWeather').style.display = 'none';
    document.querySelector('h4').style.display = 'none';
}
