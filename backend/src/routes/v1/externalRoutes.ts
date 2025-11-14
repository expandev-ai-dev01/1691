/**
 * @summary
 * External (public) API routes configuration for V1.
 * Handles publicly accessible endpoints without authentication.
 *
 * @module routes/v1/externalRoutes
 */

import { Router } from 'express';
import * as weatherController from '@/api/v1/external/weather/controller';

const router = Router();

/**
 * @route GET /api/v1/external/weather/current
 * @description Get current temperature for a location
 */
router.get('/weather/current', weatherController.getCurrentTemperature);

/**
 * @route POST /api/v1/external/weather/refresh
 * @description Manually refresh temperature data
 */
router.post('/weather/refresh', weatherController.refreshTemperature);

export default router;
