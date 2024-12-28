const apiKey = '33cb9f56249b616b1d91bed0f095501a'; // Replace with your OpenWeatherMap API key
const unitToggle = document.getElementById('unitToggle');
const cache = {};

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

// Toggle loading indicator with smooth transitions
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

// Event listener for "Get Weather" button
document.getElementById('getWeather').addEventListener('click', () => {
    if (selectedLat && selectedLon) {
        getWeatherByCoordinates(selectedLat, selectedLon, unitToggle.value);
    } else {
        const city = document.getElementById('city').value.trim();
        if (city) {
            fetchCoordinatesAndWeather(city, unitToggle.value);
        } else {
            alert('Please enter a city name');
        }
    }
});

// Event listener for input suggestions
document.getElementById('city').addEventListener('input', function () {
    const input = this.value.trim();
    if (input) {
        fetchSuggestions(input); // Fetch suggestions immediately
    } else {
        document.getElementById('suggestions').style.display = 'none'; // Hide suggestions
        toggleLoading(false); // Hide "Fetching data"
    }
});

// Event listener for unit toggle
unitToggle.addEventListener('change', () => {
    if (selectedLat && selectedLon) {
        const unit = unitToggle.value; // 'imperial' or 'metric'
        const fullName = document.getElementById('location').textContent.replace("Weather in ", "");
        getWeatherByCoordinates(selectedLat, selectedLon, unit, fullName);
    }
});



// Handle keyboard navigation and Enter key press
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
        event.preventDefault(); // Prevent form submission
        if (currentFocus > -1 && items[currentFocus]) {
            items[currentFocus].click(); // Trigger weather search for focused suggestion
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

function setActive(items) {
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('active');
    }
    if (currentFocus >= 0 && items[currentFocus]) {
        items[currentFocus].classList.add('active');
        items[currentFocus].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
}

// Fetch city suggestions
function fetchSuggestions(input) {
    if (cache[input]) {
        displaySuggestions(cache[input]); // Use cached data immediately
        return;
    }

    const loadingTimer = setTimeout(() => toggleLoading(true), 2000); // Show "Fetching data" after 2 seconds
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(input)}&limit=10&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            clearTimeout(loadingTimer); // Cancel the "Fetching data" timer
            toggleLoading(false); // Hide "Fetching data" indicator
            cache[input] = data; // Cache the results
            displaySuggestions(data); // Display the fetched suggestions
        })
        .catch(error => {
            clearTimeout(loadingTimer); // Cancel the "Fetching data" timer
            toggleLoading(false); // Hide "Fetching data" indicator
            console.error('Error fetching suggestions:', error);
        });
}

// Fetch weather data using coordinates
function getWeatherByCoordinates(lat, lon, unit, locationName) {
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
            document.getElementById('weatherDescription').innerHTML = ''; // Clear error messages
            displayWeather(data, unit, selectedState, locationName); // Pass locationName
            console.log(`Weather data received for ${locationName}`);
        })
        .catch(error => {
            toggleLoading(false);
            document.getElementById('weatherDescription').innerHTML = `
                <p class="error-message">${error.message}. Please check the city name or try again later.</p>
            `;
        });
}

// Fetch coordinates and weather by city name
function fetchCoordinatesAndWeather(city, unit) {
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=10&appid=${apiKey}`;
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

            // Use the first suggestion
            const { lat, lon, state, country, name } = data[0];
            selectedLat = lat;
            selectedLon = lon;
            selectedState = state || '';
            const fullName = `${name}, ${state ? `${state}, ` : ''}${country}`.trim();

            // Clear the input field and hide suggestions
            document.getElementById('city').value = ''; // Clear input field
            document.getElementById('suggestions').style.display = 'none'; // Hide suggestions

            console.log(`Fetched coordinates: lat=${lat}, lon=${lon}, fullName=${fullName}`);
            getWeatherByCoordinates(lat, lon, unit, fullName); // Pass the full name
        })
        .catch(error => {
            toggleLoading(false);
            document.getElementById('weatherDescription').innerHTML = `
                <p class="error-message">${error.message}. Please check the city name or try again later.</p>
            `;
        });
}

// Display suggestions
function displaySuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = ''; // Clear old suggestions
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
                document.getElementById('city').value = ''; // Clear input field
                document.getElementById('suggestions').style.display = 'none'; // Hide suggestions
                getWeatherByCoordinates(selectedLat, selectedLon, unitToggle.value, fullName); // Pass selected name
                console.log(`Selected suggestion: ${fullName}, lat=${selectedLat}, lon=${selectedLon}`);
            });

            suggestionsDiv.appendChild(div);
        });
    } else {
        suggestionsDiv.style.display = 'none';
    }
}

// Display weather data
function displayWeather(data, unit, state, locationName) {
    const weatherDiv = document.getElementById('weather');
    const weatherIcon = document.getElementById('weatherIcon');
    const locationHeader = document.getElementById('location');
    const temperatureUnit = unit === 'imperial' ? '°F' : '°C';

    // Display the passed location name
    locationHeader.textContent = `Weather in ${locationName}`;
    if (data.weather && data.weather[0]) {
        weatherIcon.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        weatherIcon.alt = data.weather[0].description;
        weatherIcon.style.display = 'block';
    } else {
        weatherIcon.style.display = 'none';
    }
    weatherDiv.innerHTML = `
        <p>Temperature: ${data.main.temp}${temperatureUnit}</p>
        <p>Weather: ${data.weather[0].description}</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind Speed: ${data.wind.speed} ${unit === 'imperial' ? 'mph' : 'm/s'}</p>
        <p>Pressure: ${data.main.pressure} hPa</p>
    `;

    // Show the weather display section
    document.querySelector('.weather-display').classList.remove('hidden');
    document.getElementById('greeting').style.display = 'none';
}


// Fetch example weather
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

document.addEventListener('DOMContentLoaded', () => {
    fetchExampleWeather();
});