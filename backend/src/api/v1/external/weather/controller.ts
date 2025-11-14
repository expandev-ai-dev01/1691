/**
 * @summary
 * Weather API controller for external (public) endpoints.
 * Handles temperature retrieval and display operations.
 *
 * @module api/v1/external/weather
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { weatherService } from '@/services/weather';
import { successResponse, errorResponse } from '@/utils/response';
import { HTTP_STATUS } from '@/constants/http';

/**
 * @api {get} /api/v1/external/weather/current Get Current Temperature
 * @apiName GetCurrentTemperature
 * @apiGroup Weather
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieves current temperature data for a specified location
 *
 * @apiParam {String} location Location name (city, state/country)
 * @apiParam {String} [unit=celsius] Temperature unit (celsius or fahrenheit)
 *
 * @apiSuccess {Number} temperature Current temperature value
 * @apiSuccess {String} unit Temperature unit (°C or °F)
 * @apiSuccess {String} location Location name
 * @apiSuccess {String} lastUpdate Last update timestamp
 * @apiSuccess {String} connectionStatus Connection status (online/offline/stale)
 *
 * @apiError {String} ValidationError Invalid parameters provided
 * @apiError {String} ServiceUnavailable Weather API unavailable
 * @apiError {String} InternalServerError Internal server error
 */
export async function getCurrentTemperature(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    /**
     * @validation Query parameter validation
     * @throw {ValidationError}
     */
    const querySchema = z.object({
      location: z.string().min(1).max(50),
      unit: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
    });

    const validated = querySchema.parse(req.query);

    /**
     * @rule {be-weather-api-integration} Fetch temperature data from external weather API
     */
    const temperatureData = await weatherService.getCurrentTemperature(
      validated.location,
      validated.unit
    );

    /**
     * @output {TemperatureResponse, 1, 1}
     * @column {Number} temperature - Current temperature value with one decimal place
     * @column {String} unit - Temperature unit symbol (°C or °F)
     * @column {String} location - Location name
     * @column {String} lastUpdate - Last update timestamp in format 'Updated at HH:MM'
     * @column {String} connectionStatus - Connection status indicator
     */
    res.json(
      successResponse({
        temperature: temperatureData.temperature,
        unit: temperatureData.unit,
        location: temperatureData.location,
        lastUpdate: temperatureData.lastUpdate,
        connectionStatus: temperatureData.connectionStatus,
      })
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse('VALIDATION_ERROR', 'Invalid request parameters', error.errors));
    } else if (error.code === 'WEATHER_API_ERROR') {
      res
        .status(HTTP_STATUS.SERVICE_UNAVAILABLE)
        .json(errorResponse('SERVICE_UNAVAILABLE', error.message));
    } else {
      next(error);
    }
  }
}

/**
 * @api {post} /api/v1/external/weather/refresh Refresh Temperature Data
 * @apiName RefreshTemperature
 * @apiGroup Weather
 * @apiVersion 1.0.0
 *
 * @apiDescription Manually refreshes temperature data for a location
 *
 * @apiParam {String} location Location name
 * @apiParam {String} [unit=celsius] Temperature unit
 *
 * @apiSuccess {Number} temperature Updated temperature value
 * @apiSuccess {String} unit Temperature unit
 * @apiSuccess {String} location Location name
 * @apiSuccess {String} lastUpdate Update timestamp
 * @apiSuccess {String} status Update status (success/error)
 *
 * @apiError {String} RateLimitError Too many refresh requests
 * @apiError {String} ServiceUnavailable Weather API unavailable
 */
export async function refreshTemperature(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    /**
     * @validation Request body validation
     * @throw {ValidationError}
     */
    const bodySchema = z.object({
      location: z.string().min(1).max(50),
      unit: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
    });

    const validated = bodySchema.parse(req.body);

    /**
     * @rule {be-rate-limiting} Enforce 30-second minimum interval between manual refreshes
     */
    const canRefresh = await weatherService.checkRefreshEligibility(validated.location);

    if (!canRefresh) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(
          errorResponse(
            'RATE_LIMIT_ERROR',
            'Please wait at least 30 seconds between manual refresh requests'
          )
        );
      return;
    }

    /**
     * @rule {be-weather-api-integration} Fetch fresh temperature data
     */
    const temperatureData = await weatherService.refreshTemperature(
      validated.location,
      validated.unit
    );

    /**
     * @output {RefreshResponse, 1, 1}
     * @column {Number} temperature - Updated temperature value
     * @column {String} unit - Temperature unit
     * @column {String} location - Location name
     * @column {String} lastUpdate - Update timestamp
     * @column {String} status - Update status indicator
     */
    res.json(
      successResponse({
        temperature: temperatureData.temperature,
        unit: temperatureData.unit,
        location: temperatureData.location,
        lastUpdate: temperatureData.lastUpdate,
        status: 'success',
      })
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse('VALIDATION_ERROR', 'Invalid request parameters', error.errors));
    } else if (error.code === 'WEATHER_API_ERROR') {
      res
        .status(HTTP_STATUS.SERVICE_UNAVAILABLE)
        .json(errorResponse('SERVICE_UNAVAILABLE', error.message));
    } else {
      next(error);
    }
  }
}
