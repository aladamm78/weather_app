const apiKey = '33cb9f56249b616b1d91bed0f095501a'; // Replace with your OpenWeatherMap API key
const unitToggle = document.getElementById('unitToggle');
const cache = {};
let currentFocus = -1; // Track the currently focused suggestion

// Toggle loading indicator
function toggleLoading(show) {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = show ? 'block' : 'none';
    loadingDiv.textContent = show ? 'Fetching data...' : '';
}

// Event listener for getting weather
document.getElementById('getWeather').addEventListener('click', () => {
    const city = document.getElementById('city').value;
    const unit = unitToggle.value;
    if (city) {
        getWeather(city, unit);
    } else {
        alert('Please enter a city name');
    }
});

// Event listener for input suggestions
document.getElementById('city').addEventListener('input', function () {
    const input = this.value;
    if (input) {
        fetchSuggestions(input);
    } else {
        document.getElementById('suggestions').style.display = 'none';
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
            // Select the focused suggestion
            items[currentFocus].click();
        } else {
            // Trigger weather search for the input value
            const city = document.getElementById('city').value;
            const unit = unitToggle.value;
            if (city) {
                getWeather(city, unit);
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
        items[currentFocus].scrollIntoView({ block: 'nearest' });
    }
}

// Fetch city suggestions
function fetchSuggestions(input) {
    if (cache[input]) {
        displaySuggestions(cache[input]);
        return;
    }
    toggleLoading(true);
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(input)}&limit=10&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            toggleLoading(false);
            cache[input] = data;
            displaySuggestions(data);
        })
        .catch(error => {
            toggleLoading(false);
            console.error('Error fetching suggestions:', error);
        });
}

// Fetch weather data
function getWeather(city, unit) {
    toggleLoading(true);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${unit}`;

    fetch(url)
        .then(response => {
            toggleLoading(false);
            if (!response.ok) throw new Error('City not found');
            return response.json();
        })
        .then(data => {
            displayWeather(data, unit);
            document.getElementById('city').value = ''; // Clear input
            document.getElementById('suggestions').style.display = 'none'; // Hide suggestions
            currentFocus = -1; // Reset focus
        })
        .catch(error => {
            toggleLoading(false);
            document.getElementById('weather').innerHTML = `
                <p style="color: red;">${error.message}. Please check the city name or try again later.</p>
            `;
        });
}

// Display weather data
function displayWeather(data, unit) {
    const weatherDiv = document.getElementById('weather');
    const temperatureUnit = unit === 'imperial' ? '°F' : '°C';
    weatherDiv.innerHTML = `
        <h2>Weather in ${data.name}</h2>
        <img src="http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">
        <p>Temperature: ${data.main.temp}${temperatureUnit}</p>
        <p>Weather: ${data.weather[0].description}</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind Speed: ${data.wind.speed} ${unit === 'imperial' ? 'mph' : 'm/s'}</p>
        <p>Pressure: ${data.main.pressure} hPa</p>
    `;
}

// Display suggestions
function displaySuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = '';
    if (suggestions.length > 0) {
        suggestionsDiv.style.display = 'block';
        suggestions.forEach((suggestion, index) => {
            const div = document.createElement('div');
            const state = suggestion.state ? `${suggestion.state}, ` : '';
            div.textContent = `${suggestion.name}, ${state}${suggestion.country}`;
            div.addEventListener('click', () => {
                document.getElementById('city').value = suggestion.name;
                document.getElementById('suggestions').style.display = 'none';
                currentFocus = -1; // Reset focus
            });
            suggestionsDiv.appendChild(div);
        });
    } else {
        suggestionsDiv.style.display = 'none';
    }
}
