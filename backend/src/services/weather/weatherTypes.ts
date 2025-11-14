/**
 * @summary
 * Weather service type definitions.
 * Defines interfaces and types for weather data structures.
 *
 * @module services/weather/weatherTypes
 */

/**
 * @interface TemperatureData
 * @description Temperature data structure returned to clients
 *
 * @property {number} temperature - Temperature value with one decimal place
 * @property {string} unit - Temperature unit symbol (°C or °F)
 * @property {string} location - Location name (city, state/country)
 * @property {string} lastUpdate - Last update timestamp in format 'Updated at HH:MM'
 * @property {ConnectionStatus} connectionStatus - Connection status indicator
 */
export interface TemperatureData {
  temperature: number;
  unit: string;
  location: string;
  lastUpdate: string;
  connectionStatus: ConnectionStatus;
}

/**
 * @interface WeatherApiResponse
 * @description External weather API response structure
 *
 * @property {object} location - Location information
 * @property {object} current - Current weather data
 */
export interface WeatherApiResponse {
  location: {
    name: string;
    region: string;
    country: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
    };
  };
}

/**
 * @type TemperatureUnit
 * @description Temperature unit options
 */
export type TemperatureUnit = 'celsius' | 'fahrenheit';

/**
 * @type ConnectionStatus
 * @description Connection status indicators
 */
export type ConnectionStatus = 'online' | 'offline' | 'stale';
