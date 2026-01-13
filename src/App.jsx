import { useState } from 'react';
import Footer from './components/Footer.jsx'
import Weather from './components/Weather.jsx'

function App() {
  const [bgClass, setBgClass] = useState('from-gray-900 via-purple-900 to-indigo-900');

  const handleWeatherChange = (weatherCode) => {
    // Map OpenWeatherMap icon codes/conditions to gradients
    // Codes: https://openweathermap.org/weather-conditions
    const code = weatherCode?.toString().toLowerCase();
    
    if (!code) return;

    if (code.includes('01')) { // Clear
      setBgClass('from-blue-400 via-blue-500 to-blue-600');
    } else if (code.includes('02') || code.includes('03') || code.includes('04')) { // Clouds
      setBgClass('from-gray-400 via-gray-500 to-gray-600');
    } else if (code.includes('09') || code.includes('10')) { // Rain
      setBgClass('from-gray-700 via-gray-800 to-gray-900');
    } else if (code.includes('11')) { // Thunderstorm
      setBgClass('from-slate-900 via-purple-900 to-slate-900');
    } else if (code.includes('13')) { // Snow
      setBgClass('from-blue-100 via-blue-200 to-blue-300 text-gray-800'); // Lighter theme for snow
    } else if (code.includes('50')) { // Mist
      setBgClass('from-gray-500 via-gray-400 to-gray-500');
    } else {
      setBgClass('from-gray-900 via-purple-900 to-indigo-900'); // Default
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgClass} flex flex-col items-center justify-center p-4 font-sans transition-colors duration-1000 ease-in-out`}>
      <Weather onWeatherLoad={handleWeatherChange} />
      <Footer />
    </div>
  )
}

export default App
