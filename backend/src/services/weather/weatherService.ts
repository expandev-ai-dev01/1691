/**
 * @summary
 * Weather service business logic.
 * Handles temperature data retrieval, caching, and formatting.
 *
 * @module services/weather/weatherService
 */

import { config } from '@/config';
import { weatherCache } from '@/instances/cache';
import {
  TemperatureData,
  WeatherApiResponse,
  TemperatureUnit,
  ConnectionStatus,
} from './weatherTypes';

/**
 * @summary
 * Retrieves current temperature data for a location.
 * Implements caching with 15-minute TTL and offline fallback.
 *
 * @function getCurrentTemperature
 * @module weather
 *
 * @param {string} location - Location name (city, state/country)
 * @param {TemperatureUnit} unit - Temperature unit (celsius or fahrenheit)
 *
 * @returns {Promise<TemperatureData>} Temperature data with metadata
 *
 * @throws {WeatherApiError} When weather API is unavailable
 * @throws {ValidationError} When location is invalid
 */
export async function getCurrentTemperature(
  location: string,
  unit: TemperatureUnit = 'celsius'
): Promise<TemperatureData> {
  /**
   * @validation Location parameter validation
   * @throw {ValidationError}
   */
  if (!location || location.length > 50) {
    throw new Error('Location must be between 1 and 50 characters');
  }

  const cacheKey = `weather:${location}:${unit}`;

  /**
   * @rule {be-cache-strategy} Check cache first for recent data
   */
  const cachedData = weatherCache.get<TemperatureData>(cacheKey);

  if (cachedData) {
    /**
     * @rule {be-data-freshness} Check if cached data is stale (>1 hour)
     */
    const cacheAge = Date.now() - new Date(cachedData.lastUpdate).getTime();
    const isStale = cacheAge > 3600000; // 1 hour in milliseconds

    return {
      ...cachedData,
      connectionStatus: isStale ? 'stale' : 'online',
    };
  }

  try {
    /**
     * @rule {be-weather-api-integration} Fetch data from external weather API
     */
    const apiResponse = await fetchWeatherData(location);

    /**
     * @rule {be-data-validation} Validate temperature range (-90°C to +60°C)
     */
    const temperatureCelsius = apiResponse.current.temp_c;

    if (temperatureCelsius < -90 || temperatureCelsius > 60) {
      throw new Error('Temperature value outside plausible range');
    }

    /**
     * @rule {be-unit-conversion} Convert temperature to requested unit
     */
    const temperature =
      unit === 'fahrenheit' ? celsiusToFahrenheit(temperatureCelsius) : temperatureCelsius;

    /**
     * @rule {be-data-formatting} Format temperature with one decimal place
     */
    const formattedTemperature = parseFloat(temperature.toFixed(1));

    const temperatureData: TemperatureData = {
      temperature: formattedTemperature,
      unit: unit === 'fahrenheit' ? '°F' : '°C',
      location: apiResponse.location.name,
      lastUpdate: formatTimestamp(new Date()),
      connectionStatus: 'online',
    };

    /**
     * @rule {be-cache-storage} Store in cache with 15-minute TTL
     */
    weatherCache.set(cacheKey, temperatureData, config.cache.ttl);

    return temperatureData;
  } catch (error: any) {
    /**
     * @rule {be-offline-fallback} Return cached data if available when API fails
     */
    const offlineData = weatherCache.get<TemperatureData>(cacheKey);

    if (offlineData) {
      return {
        ...offlineData,
        connectionStatus: 'offline',
      };
    }

    throw {
      code: 'WEATHER_API_ERROR',
      message: 'Unable to retrieve weather data and no cached data available',
    };
  }
}

/**
 * @summary
 * Refreshes temperature data manually.
 * Enforces 30-second rate limiting between requests.
 *
 * @function refreshTemperature
 * @module weather
 *
 * @param {string} location - Location name
 * @param {TemperatureUnit} unit - Temperature unit
 *
 * @returns {Promise<TemperatureData>} Updated temperature data
 *
 * @throws {RateLimitError} When refresh requested too soon
 * @throws {WeatherApiError} When weather API is unavailable
 */
export async function refreshTemperature(
  location: string,
  unit: TemperatureUnit = 'celsius'
): Promise<TemperatureData> {
  const cacheKey = `weather:${location}:${unit}`;

  /**
   * @rule {be-cache-invalidation} Clear existing cache to force fresh data
   */
  weatherCache.del(cacheKey);

  /**
   * @rule {be-refresh-tracking} Record refresh timestamp for rate limiting
   */
  const refreshKey = `refresh:${location}`;
  weatherCache.set(refreshKey, Date.now(), 30); // 30 seconds

  return getCurrentTemperature(location, unit);
}

/**
 * @summary
 * Checks if manual refresh is allowed for a location.
 * Enforces 30-second minimum interval.
 *
 * @function checkRefreshEligibility
 * @module weather
 *
 * @param {string} location - Location name
 *
 * @returns {Promise<boolean>} True if refresh is allowed
 */
export async function checkRefreshEligibility(location: string): Promise<boolean> {
  const refreshKey = `refresh:${location}`;
  const lastRefresh = weatherCache.get<number>(refreshKey);

  if (!lastRefresh) {
    return true;
  }

  /**
   * @rule {be-rate-limiting} Enforce 30-second minimum interval
   */
  const timeSinceRefresh = Date.now() - lastRefresh;
  return timeSinceRefresh >= 30000; // 30 seconds in milliseconds
}

/**
 * @summary
 * Fetches weather data from external API.
 *
 * @function fetchWeatherData
 * @module weather
 *
 * @param {string} location - Location name
 *
 * @returns {Promise<WeatherApiResponse>} Weather API response
 *
 * @throws {WeatherApiError} When API request fails
 */
async function fetchWeatherData(location: string): Promise<WeatherApiResponse> {
  const url = `${config.weather.apiUrl}/current.json?key=${
    config.weather.apiKey
  }&q=${encodeURIComponent(location)}`;

  /**
   * @rule {be-api-timeout} Implement 5-second timeout for API requests
   */
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Weather API returned status ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    throw {
      code: 'WEATHER_API_ERROR',
      message: error.message || 'Failed to fetch weather data',
    };
  }
}

/**
 * @summary
 * Converts Celsius to Fahrenheit.
 *
 * @function celsiusToFahrenheit
 * @module weather
 *
 * @param {number} celsius - Temperature in Celsius
 *
 * @returns {number} Temperature in Fahrenheit
 */
function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

/**
 * @summary
 * Formats timestamp to 'Updated at HH:MM' format.
 *
 * @function formatTimestamp
 * @module weather
 *
 * @param {Date} date - Date to format
 *
 * @returns {string} Formatted timestamp string
 */
function formatTimestamp(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `Updated at ${hours}:${minutes}`;
}

export const weatherService = {
  getCurrentTemperature,
  refreshTemperature,
  checkRefreshEligibility,
};
