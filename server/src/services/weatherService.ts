import axios from 'axios';

export interface WeatherData {
  temperature: string;
  condition: string;
  aqi: string;
  humidity: string;
  windSpeed: string;
  locationName: string;
  temperatureC: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  aqiIndex: number | null;
  aqiLabel: string;
  workerSafetyLevel: 'Safe' | 'Caution' | 'Restricted' | 'Hazardous';
  workerSafetyAdvisory: string;
}

export const getWeatherAndAQI = async (lat: number, lng: number): Promise<WeatherData> => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY || process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    return getFallbackWeather();
  }

  try {
    // Get current weather
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );

    // Get air pollution data
    const aqiResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${apiKey}`
    );

    const weather = weatherResponse.data;
    const airQuality = aqiResponse.data.list[0];

    const aqiValue = airQuality.main.aqi;
    const aqiText = getAQIText(aqiValue);
    const temperatureC = Math.round(weather.main.temp);
    const humidityPercent = weather.main.humidity;
    const windSpeedKmh = Math.round(weather.wind.speed * 3.6);
    const workerSafety = assessWorkerSafety(aqiValue, temperatureC, windSpeedKmh);

    return {
      temperature: `${temperatureC}°C`,
      condition: weather.weather[0].description,
      aqi: `${aqiValue} (${aqiText})`,
      humidity: `${humidityPercent}%`,
      windSpeed: `${windSpeedKmh} km/h`,
      locationName: weather.name,
      temperatureC,
      humidityPercent,
      windSpeedKmh,
      aqiIndex: aqiValue,
      aqiLabel: aqiText,
      workerSafetyLevel: workerSafety.level,
      workerSafetyAdvisory: workerSafety.advisory,
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return getFallbackWeather();
  }
};

const getAQIText = (aqi: number): string => {
  const aqiLevels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor', 'Extremely Poor'];
  return aqiLevels[aqi - 1] || 'Unknown';
};

const assessWorkerSafety = (
  aqiIndex: number,
  temperatureC: number,
  windSpeedKmh: number
): { level: 'Safe' | 'Caution' | 'Restricted' | 'Hazardous'; advisory: string } => {
  const heatStress = temperatureC >= 38;
  const strongWind = windSpeedKmh >= 45;

  if (aqiIndex >= 5 || (aqiIndex >= 4 && heatStress)) {
    return {
      level: 'Hazardous',
      advisory: 'Suspend non-essential outdoor work, enforce respirators, and shorten exposure windows.',
    };
  }

  if (aqiIndex >= 4 || heatStress || strongWind) {
    return {
      level: 'Restricted',
      advisory: 'Limit outdoor shifts, mandate PPE, and increase active monitoring for worker fatigue and breathing stress.',
    };
  }

  if (aqiIndex >= 3) {
    return {
      level: 'Caution',
      advisory: 'Allow operations with dust masks and hydration breaks while tracking AQI and heat trends.',
    };
  }

  return {
    level: 'Safe',
    advisory: 'Normal outdoor operations are acceptable with standard site PPE and routine weather checks.',
  };
};

const getFallbackWeather = (): WeatherData => ({
  temperature: '--',
  condition: 'Unavailable',
  aqi: '--',
  humidity: '--',
  windSpeed: '--',
  locationName: 'Service Unavailable',
  temperatureC: null,
  humidityPercent: null,
  windSpeedKmh: null,
  aqiIndex: null,
  aqiLabel: 'Unavailable',
  workerSafetyLevel: 'Caution',
  workerSafetyAdvisory: 'External weather and AQI services are unavailable; run on-site manual safety checks.',
});
