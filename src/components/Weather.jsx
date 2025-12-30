import search_icon from '../assets/search.png';
import sun_icon from '../assets/clear.png';
import humidity_icon from '../assets/humidity.png';
import wind_icon from '../assets/wind.png';
import clear_icon from '../assets/clear.png';
import cloud_icon from '../assets/cloud.png';
import drizzle_icon from '../assets/drizzle.png';
import rain_icon from '../assets/rain.png';
import snow_icon from '../assets/snow.png';
import { useEffect, useState, useRef } from 'react';

const Weather = () => {
  const inputRef = useRef();
  const [weatherData, setWeatherData] = useState(false);

  const allIcons = {
    "01d": clear_icon,
    "01n": clear_icon,
    "02d": cloud_icon,
    "02n": cloud_icon,
    "03d": cloud_icon,
    "03n": cloud_icon,
    "04d": drizzle_icon,
    "04n": drizzle_icon,
    "09d": rain_icon,
    "09n": rain_icon,
    "10d": rain_icon,
    "10n": rain_icon,
    "13d": snow_icon,
    "13n": snow_icon
  };

  const search = async (city) => {
    if (city === "") {
      alert("Please enter a city name");
      return;
    }
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.cod !== 200) {
        alert("City not found");
        setWeatherData(false);
        return;
      }

      const icon = allIcons[data.weather[0].icon] || clear_icon;
      setWeatherData({
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        temperature: Math.floor(data.main.temp),
        location: data.name,
        icon: icon
      });
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setWeatherData(false);
    }
  };

  useEffect(() => {
    search("Pune");
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-purple-500 px-4">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-gradient-to-b from-blue-400 to-blue-600 shadow-2xl rounded-md text-center py-8 px-6">
        
        {/* Search Bar */}
        <div className="flex items-center bg-white rounded-3xl px-4 py-2 mb-6 w-full max-w-sm mx-auto">
          <input
            ref={inputRef}
            className="flex-grow outline-none text-gray-700 text-base"
            type="text"
            placeholder="Search City"
          />
          <img
            onClick={() => search(inputRef.current.value)}
            className="w-6 h-6 ml-2 cursor-pointer"
            src={search_icon}
            alt="Search"
          />
        </div>

        {/* Weather Info */}
        {weatherData ? (
          <>
            <img src={weatherData.icon} alt="Weather Icon" className="w-24 h-24 mb-4 mx-auto" />
            <h1 className="text-white text-5xl sm:text-6xl font-bold mb-2">{weatherData.temperature}°C</h1>
            <h2 className="text-white text-xl sm:text-2xl font-semibold mb-6">{weatherData.location}</h2>

            <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-10 text-white text-lg">
              <div className="flex items-center gap-2">
                <img src={humidity_icon} alt="Humidity" className="w-6 h-6" />
                <span>{weatherData.humidity}% Humidity</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={wind_icon} alt="Wind Speed" className="w-6 h-6" />
                <span>{weatherData.windSpeed} Km/h Wind</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-white text-lg mt-4">No weather data available</p>
        )}
      </div>
    </div>
  );
};

export default Weather;