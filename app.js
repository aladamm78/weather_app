const apiKey = '33cb9f56249b616b1d91bed0f095501a'; // Replace with your OpenWeatherMap API key
const unitToggle = document.getElementById('unitToggle'); // Get the unit toggle element
const cache = {}; // Cache for storing suggestions and weather data

// Toggle loading indicator
function toggleLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// Event listener for getting weather
document.getElementById('getWeather').addEventListener('click', () => {
    const city = document.getElementById('city').value;
    const unit = unitToggle.value; // Get the selected unit
    if (city) {
        getWeather(city, unit); // Pass the unit to the getWeather function
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

// Fetch city suggestions
function fetchSuggestions(input) {
    if (cache[input]) {
        displaySuggestions(cache[input]);
        return;
    }
    toggleLoading(true);
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(input)}&limit=5&appid=${apiKey}`;
    
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
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${unit}`; // Use the selected unit
    
    fetch(url)
        .then(response => {
            toggleLoading(false);
            if (!response.ok) throw new Error('City not found');
            return response.json();
        })
        .then(data => {
            displayWeather(data, unit); // Pass the unit to displayWeather
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
    const temperatureUnit = unit === 'imperial' ? '°F' : '°C'; // Determine the unit for display
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
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            const state = suggestion.state ? `${suggestion.state}, ` : '';
            div.textContent = `${suggestion.name}, ${state}${suggestion.country}`;
            div.addEventListener('click', () => {
                document.getElementById('city').value = suggestion.name;
                suggestionsDiv.style.display = 'none';
            });
            suggestionsDiv.appendChild(div);
        });
    }
}
