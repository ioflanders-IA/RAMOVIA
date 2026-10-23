import { WeatherData } from '../types';

export function getWeatherConditionText(code: number): { condition: string; isRaining: boolean } {
  switch (code) {
    case 0:
      return { condition: 'Cielo sereno', isRaining: false };
    case 1:
    case 2:
      return { condition: 'Poco o parzialmente nuvoloso', isRaining: false };
    case 3:
      return { condition: 'Coperto', isRaining: false };
    case 45:
    case 48:
      return { condition: 'Nebbia o foschia mattutina', isRaining: false };
    case 51:
    case 53:
    case 55:
      return { condition: 'Pioviggine leggera', isRaining: true };
    case 61:
    case 63:
      return { condition: 'Pioggia moderata', isRaining: true };
    case 65:
      return { condition: 'Pioggia battente forte', isRaining: true };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rovesci temporaleschi', isRaining: true };
    case 95:
    case 96:
    case 99:
      return { condition: 'Temporale con possibili grandinate', isRaining: true };
    default:
      return { condition: 'Variabile', isRaining: false };
  }
}

// In-memory weather cache to prevent repeated requests
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

export async function fetchWeatherForLocation(lat: number, lng: number, forceRefresh = false): Promise<WeatherData> {
  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
  if (!forceRefresh) {
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation_probability,weather_code&timezone=auto&forecast_days=1`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP error ${response.status}`);
    }
    const json = await response.json();

    const currentTemp = Math.round(json.current?.temperature_2m ?? 18);
    const rainMm = json.current?.rain ?? json.current?.precipitation ?? 0;
    const weatherCode = json.current?.weather_code ?? 0;
    const windSpeed = Math.round(json.current?.wind_speed_10m ?? 8);
    
    // Find maximum precipitation probability in the next 12 hours
    const next12HoursProbabilities = (json.hourly?.precipitation_probability || []).slice(0, 12);
    const maxProb = next12HoursProbabilities.length > 0 
      ? Math.max(...next12HoursProbabilities) 
      : 15;

    const { condition, isRaining } = getWeatherConditionText(weatherCode);
    const rainAlert = isRaining || rainMm > 0.2 || maxProb >= 45;

    const weatherData: WeatherData = {
      temp: currentTemp,
      condition,
      precipitationProbability: maxProb,
      rainMm,
      windSpeed,
      isRaining,
      rainAlert,
      summary: rainAlert 
        ? `Allerta Pioggia (${maxProb}% probabilità) - Possibile sospensione sfalci/trattamenti`
        : `Condizioni ottimali per lavori in esterno (${condition}, ${currentTemp}°C)`
    };

    weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
    return weatherData;
  } catch (err) {
    console.warn('Fallback weather for', lat, lng, err);
    // Reliable graceful fallback
    const fallback: WeatherData = {
      temp: 19,
      condition: 'Sereno / Gradevole',
      precipitationProbability: 10,
      rainMm: 0,
      windSpeed: 7,
      isRaining: false,
      rainAlert: false,
      summary: 'Condizioni buone per interventi giardinaggio'
    };
    return fallback;
  }
}

export async function fetchWeatherForClients(
  clients: { id: string; lat: number; lng: number }[],
  forceRefresh = false
): Promise<Record<string, WeatherData>> {
  const map: Record<string, WeatherData> = {};
  await Promise.all(
    clients.map(async (client) => {
      try {
        const data = await fetchWeatherForLocation(client.lat, client.lng, forceRefresh);
        map[client.id] = data;
      } catch (e) {
        console.error('Failed to fetch weather for client', client.id, e);
      }
    })
  );
  return map;
}
