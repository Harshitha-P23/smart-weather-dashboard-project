const GEO_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

// Search weather by city
async function getWeather() {

    const city = document.getElementById("city").value.trim();

    if (!city) {
        alert("Please enter a city name!");
        return;
    }

    document.getElementById("location").innerText = "Searching...";

    try {

        // Get city coordinates
        const geoResponse = await fetch(
            `${GEO_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        if (!geoResponse.ok) {
            throw new Error("Location search failed");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            alert("City not found!");
            return;
        }

        const place = geoData.results[0];

        // Fetch weather information
        await loadWeather(
            place.latitude,
            place.longitude,
            place.name,
            place.country
        );

    } catch (error) {

        console.error(error);
        alert("Unable to fetch weather. Check your internet connection.");

    }
}


// Get live weather
async function loadWeather(latitude, longitude, city, country) {

    const url = `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,precipitation_probability,weather_code,wind_speed_10m&hourly=precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Weather data unavailable");
    }

    const data = await response.json();

    const current = data.current;

    // Display location
    document.getElementById("location").innerText =
        `${city}, ${country}`;

    // Display temperature
    document.getElementById("temperature").innerText =
        `${Math.round(current.temperature_2m)}°C`;

    // Display weather condition
    document.getElementById("condition").innerText =
        getWeatherCondition(current.weather_code);

    // Display humidity
    document.getElementById("humidity").innerText =
        `${current.relative_humidity_2m}%`;

    // Display wind speed
    document.getElementById("wind").innerText =
        `${current.wind_speed_10m} km/h`;

    // Display feels like
    document.getElementById("feels").innerText =
        `${Math.round(current.apparent_temperature)}°C`;

    // Display rain probability
    document.getElementById("rain").innerText =
        `${current.precipitation_probability ?? "N/A"}%`;

    // Display forecast
    displayForecast(data.daily);

    // Generate insights
    generateInsights(current, data.daily);
}


// Convert weather codes into descriptions
function getWeatherCondition(code) {

    if (code === 0) return "Clear Sky ☀️";
    if (code <= 3) return "Partly Cloudy 🌤️";
    if (code <= 48) return "Foggy 🌫️";
    if (code <= 57) return "Drizzle 🌦️";
    if (code <= 67) return "Rainy 🌧️";
    if (code <= 77) return "Snowy ❄️";
    if (code <= 82) return "Rain Showers 🌧️";
    if (code <= 86) return "Snow Showers ❄️";
    if (code <= 99) return "Thunderstorm ⛈️";

    return "Unknown";
}


// Display 7-day forecast
function displayForecast(daily) {

    const forecast = document.getElementById("forecast");

    forecast.innerHTML = "";

    for (let i = 0; i < daily.time.length; i++) {

        const day = new Date(daily.time[i] + "T00:00:00");

        const dayName = day.toLocaleDateString("en-US", {
            weekday: "short"
        });

        forecast.innerHTML += `
            <div>
                <h3>${dayName}</h3>
                <p>${getWeatherCondition(daily.weather_code[i])}</p>
                <h2>${Math.round(daily.temperature_2m_max[i])}°C</h2>
                <p>Low: ${Math.round(daily.temperature_2m_min[i])}°C</p>
                <p>Rain: ${daily.precipitation_probability_max[i] ?? "N/A"}%</p>
            </div>
        `;
    }
}


// Generate smart weather insights
function generateInsights(current, daily) {

    const insights = document.getElementById("insights");

    let message = [];

    if (current.temperature_2m > 35) {
        message.push("High temperature! Stay hydrated.");
    }

    if (current.relative_humidity_2m > 80) {
        message.push("High humidity detected.");
    }

    if (current.precipitation_probability > 60) {
        message.push("High chance of rain. Carry an umbrella.");
    }

    if (current.wind_speed_10m > 30) {
        message.push("Strong winds detected. Be careful outdoors.");
    }

    if (message.length === 0) {
        message.push("Weather conditions look comfortable!");
    }

    insights.innerHTML = message.map(item =>
        `<p>🌟 ${item}</p>`
    ).join("");
}


// Get user's current location
function getLocation() {

    if (!navigator.geolocation) {
        alert("Geolocation is not supported.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            await loadWeather(
                latitude,
                longitude,
                "Your Current Location",
                ""
            );

        },

        () => {
            alert("Please allow location access.");
        }
    );
}