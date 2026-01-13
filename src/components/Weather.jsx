import { useEffect, useState, useRef } from 'react';
import search_icon from '../assets/search.png';
import clear_icon from '../assets/clear.png';
import cloud_icon from '../assets/cloud.png';
import drizzle_icon from '../assets/drizzle.png';
import rain_icon from '../assets/rain.png';
import snow_icon from '../assets/snow.png';
import wind_icon from '../assets/wind.png';
import humidity_icon from '../assets/humidity.png';

const Weather = ({ onWeatherLoad }) => {
  const inputRef = useRef();
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State Features
  const [unit, setUnit] = useState('metric');
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecent, setShowRecent] = useState(false);

  const allIcons = {
    "01d": clear_icon, "01n": clear_icon,
    "02d": cloud_icon, "02n": cloud_icon,
    "03d": cloud_icon, "03n": cloud_icon,
    "04d": drizzle_icon, "04n": drizzle_icon,
    "09d": rain_icon, "09n": rain_icon,
    "10d": rain_icon, "10n": rain_icon,
    "11d": rain_icon, "11n": rain_icon,
    "13d": snow_icon, "13n": snow_icon,
    "50d": cloud_icon, "50n": cloud_icon
  };

  const API_KEY = import.meta.env.VITE_APP_ID;

  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    setRecentSearches(savedSearches);
  }, []);

  const addToRecent = (city) => {
    if (!city) return;
    let updated = [city, ...recentSearches.filter(c => c.toLowerCase() !== city.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const fetchData = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Location not found');
        return await response.json();
    } catch (err) {
        throw err;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  const getAQIDescription = (aqi) => {
    switch(aqi) {
        case 1: return { text: "Good", color: "text-green-400" };
        case 2: return { text: "Fair", color: "text-yellow-400" };
        case 3: return { text: "Moderate", color: "text-orange-400" };
        case 4: return { text: "Poor", color: "text-red-400" };
        case 5: return { text: "Very Poor", color: "text-purple-500" };
        default: return { text: "Unknown", color: "text-gray-400" };
    }
  };

  const getWeatherData = async (query = '', lat = null, lon = null) => {
    setLoading(true);
    setError(null);
    setShowRecent(false);

    try {
      let weatherUrl = `https://api.openweathermap.org/data/2.5/weather?units=${unit}&appid=${API_KEY}`;
      let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?units=${unit}&appid=${API_KEY}`;
      
      // We need lat/lon for AQI, so if query provided, fetch weather first to get coords
      if (lat === null && lon === null) {
          weatherUrl += `&q=${query}`;
          const tempWeather = await fetchData(weatherUrl);
          lat = tempWeather.coord.lat;
          lon = tempWeather.coord.lon;
          // Re-set forecast url with coords to be consistent
          forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?units=${unit}&appid=${API_KEY}&lat=${lat}&lon=${lon}`;
          // Re-set weather url is technically not needed but let's keep clean data flow
          weatherUrl = `https://api.openweathermap.org/data/2.5/weather?units=${unit}&appid=${API_KEY}&lat=${lat}&lon=${lon}`;
      } else {
        weatherUrl += `&lat=${lat}&lon=${lon}`;
        forecastUrl += `&lat=${lat}&lon=${lon}`;
      }

      let aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

      const [weatherData, forecastData, aqiData] = await Promise.all([
        fetchData(weatherUrl),
        fetchData(forecastUrl),
        fetchData(aqiUrl)
      ]);

      if (onWeatherLoad) onWeatherLoad(weatherData.weather[0].icon);
      if (query) addToRecent(weatherData.name);

      // Current Weather
      const icon = allIcons[weatherData.weather[0].icon] || clear_icon;
      setCurrentWeather({
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
        windDeg: weatherData.wind.deg,
        temperature: Math.floor(weatherData.main.temp),
        location: weatherData.name,
        description: weatherData.weather[0].description,
        icon: icon,
        feels_like: Math.floor(weatherData.main.feels_like),
        pressure: weatherData.main.pressure,
        sunrise: formatTime(weatherData.sys.sunrise),
        sunset: formatTime(weatherData.sys.sunset),
        visibility: (weatherData.visibility / 1000).toFixed(1),
        aqi: aqiData.list[0].main.aqi
      });

      // Daily Forecast
      const dailyForecast = forecastData.list.filter((reading) => reading.dt_txt.includes("12:00:00")).slice(0, 5);
      setForecast(dailyForecast.map(day => ({
        date: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        temp: Math.floor(day.main.temp),
        icon: allIcons[day.weather[0].icon] || clear_icon,
        description: day.weather[0].main
      })));

      // Hourly Forecast (Next 8 items ~ 24h)
      setHourlyForecast(forecastData.list.slice(0, 8).map(item => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        temp: Math.floor(item.main.temp),
        icon: allIcons[item.weather[0].icon] || clear_icon
      })));

    } catch (err) {
      console.error(err);
      setError(err.message === 'Location not found' ? 'City not found.' : 'Error fetching data.');
      setCurrentWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (inputRef.current.value.trim() === "") return;
    getWeatherData(inputRef.current.value);
  };

  const handleKeyDown = (e) => {
     if (e.key === 'Enter') handleSearch();
  };

  useEffect(() => {
    if (currentWeather) {
        getWeatherData(currentWeather.location);
    } else {
        getWeatherData("New Delhi");
    }
  }, [unit]);

  const toggleUnit = () => {
    setUnit(prev => prev === 'metric' ? 'imperial' : 'metric');
  };

  return (
    <div className="w-full max-w-5xl bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in text-white relative">
      
      {/* Unit Toggle */}
      <button 
        onClick={toggleUnit}
        className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-bold transition"
      >
        {unit === 'metric' ? '°C' : '°F'}
      </button>

      {/* LEFT COLUMN */}
      <div className="w-full md:w-5/12 p-8 flex flex-col justify-between bg-black/10 text-center md:text-left relative">
          
          {/* Search */}
          <div className="relative z-20">
            <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2 mb-2 shadow-inner">
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Search city..." 
                    className="bg-transparent border-none outline-none text-white placeholder-gray-300 w-full"
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowRecent(true)}
                />
                <img 
                    src={search_icon} 
                    alt="search" 
                    className="w-5 h-5 cursor-pointer hover:opacity-80 transition"
                    onClick={handleSearch}
                />
            </div>
            
            {showRecent && recentSearches.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-slate-800/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg mt-1 border border-white/10">
                    <div className="flex justify-between items-center px-4 py-2 bg-white/5">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Recent</span>
                        <button onClick={() => setShowRecent(false)} className="text-xs text-gray-400 hover:text-white">✕</button>
                    </div>
                    {recentSearches.map((city, idx) => (
                        <div 
                            key={idx}
                            className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm transition text-left"
                            onClick={() => {
                                inputRef.current.value = city;
                                getWeatherData(city);
                            }}
                        >
                            {city}
                        </div>
                    ))}
                </div>
            )}
          </div>

          {loading ? (
               <div className="flex-1 flex items-center justify-center p-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
               </div>
          ) : error ? (
              <div className="flex-1 flex items-center justify-center text-red-300 text-lg font-medium p-10">
                  {error}
              </div>
          ) : currentWeather ? (
              <div className="flex flex-col items-center md:items-start flex-1 animate-fade-in mt-4">
                  <div className="flex items-center justify-between w-full mb-4">
                      <h2 className="text-3xl font-bold tracking-wide">{currentWeather.location}</h2>
                      <button 
                          onClick={() => {
                              if (navigator.geolocation) {
                                  navigator.geolocation.getCurrentPosition(
                                      (pos) => getWeatherData('', pos.coords.latitude, pos.coords.longitude),
                                      () => alert("Location access denied")
                                  );
                              }
                          }}
                          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition"
                      >
                          📍 My Location
                      </button>
                  </div>
                  
                  <div className="flex flex-col items-center md:items-start mb-6">
                      <img src={currentWeather.icon} alt="weather icon" className="w-32 h-32 drop-shadow-lg" />
                      <h1 className="text-8xl font-thin tracking-tighter">{currentWeather.temperature}°</h1>
                      <p className="text-xl text-blue-200 capitalize mt-2">{currentWeather.description}</p>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-4 mt-auto">
                      <div className="bg-white/10 p-3 rounded-xl flex items-center space-x-3">
                          <img src={humidity_icon} alt="humidity" className="w-6 h-6"/>
                          <div>
                              <p className="text-xs text-gray-300">Humidity</p>
                              <p className="font-semibold">{currentWeather.humidity}%</p>
                          </div>
                      </div>
                      <div className="bg-white/10 p-3 rounded-xl flex items-center space-x-3">
                          <img src={wind_icon} alt="wind" className="w-6 h-6 transform transition-transform" style={{transform: `rotate(${currentWeather.windDeg}deg)`}}/>
                          <div>
                              <p className="text-xs text-gray-300">Wind</p>
                              <p className="font-semibold">{currentWeather.windSpeed} <span className="text-xs">{unit === 'metric' ? 'km/h' : 'mph'}</span></p>
                          </div>
                      </div>
                  </div>
              </div>
          ) : null}
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full md:w-7/12 p-8 bg-black/20 overflow-y-auto max-h-[90vh] scrollbar-hide">
           {currentWeather && (
               <div className="space-y-8">
                  
                  {/* Hourly Forecast */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Hourly Forecast</h3>
                    <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                        {hourlyForecast.map((hour, idx) => (
                            <div key={idx} className="flex-shrink-0 flex flex-col items-center bg-white/5 p-3 rounded-xl min-w-[80px]">
                                <span className="text-xs text-gray-300">{hour.time}</span>
                                <img src={hour.icon} className="w-8 h-8 my-2" alt="icon"/>
                                <span className="font-bold">{hour.temp}°</span>
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Weather Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       
                       {/* AQI Card */}
                       <div className="bg-white/5 p-4 rounded-2xl text-center hover:bg-white/10 transition flex flex-col items-center justify-center">
                          <p className="text-gray-400 text-xs text-center">Air Quality</p>
                          <p className={`text-xl font-bold ${getAQIDescription(currentWeather.aqi).color}`}>{getAQIDescription(currentWeather.aqi).text}</p>
                          <div className="w-full bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
                              <div className={`h-full ${getAQIDescription(currentWeather.aqi).color.replace('text-', 'bg-')} transition-all duration-500`} style={{width: `${currentWeather.aqi * 20}%`}}></div>
                          </div>
                       </div>

                       <div className="bg-white/5 p-4 rounded-2xl text-center hover:bg-white/10 transition">
                          <p className="text-gray-400 text-xs">Feels Like</p>
                          <p className="text-xl font-bold">{currentWeather.feels_like}°</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl text-center hover:bg-white/10 transition">
                          <p className="text-gray-400 text-xs">Visibility</p>
                          <p className="text-xl font-bold">{currentWeather.visibility} km</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl text-center hover:bg-white/10 transition">
                          <p className="text-gray-400 text-xs">Pressure</p>
                          <p className="text-xl font-bold">{currentWeather.pressure}</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl text-center hover:bg-white/10 transition">
                          <p className="text-gray-400 text-xs">Sunrise</p>
                          <p className="text-lg font-bold">{currentWeather.sunrise}</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl text-center hover:bg-white/10 transition">
                          <p className="text-gray-400 text-xs">Sunset</p>
                          <p className="text-lg font-bold">{currentWeather.sunset}</p>
                       </div>
                    </div>
                  </div>

                  {/* 5-Day Forecast */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3">5-Day Forecast</h3>
                    <div className="space-y-3">
                        {forecast.map((day, index) => (
                            <div key={index} className="flex items-center justify-between bg-white/5 p-3 rounded-xl hover:bg-white/15 transition cursor-default">
                                <p className="w-16 font-medium text-gray-200">{day.date}</p>
                                <div className="flex items-center space-x-2">
                                    <img src={day.icon} alt="icon" className="w-8 h-8"/>
                                    <p className="text-sm text-gray-300 capitalize hidden sm:block">{day.description}</p>
                                </div>
                                <p className="font-bold text-lg">{day.temp}°</p>
                            </div>
                        ))}
                    </div>
                  </div>
               </div>
           )}
      </div>

    </div>
  );
};

export default Weather;