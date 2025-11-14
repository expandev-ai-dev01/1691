/**
 * @summary
 * In-memory cache instance for weather data.
 * Implements TTL-based caching with automatic cleanup.
 *
 * @module instances/cache
 */

import { config } from '@/config';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * @summary
   * Stores data in cache with TTL.
   *
   * @function set
   * @module cache
   *
   * @param {string} key - Cache key
   * @param {T} data - Data to cache
   * @param {number} ttl - Time to live in seconds
   */
  set<T>(key: string, data: T, ttl: number = config.cache.ttl): void {
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * @summary
   * Retrieves data from cache.
   *
   * @function get
   * @module cache
   *
   * @param {string} key - Cache key
   *
   * @returns {T | null} Cached data or null if expired/not found
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * @summary
   * Deletes data from cache.
   *
   * @function del
   * @module cache
   *
   * @param {string} key - Cache key
   */
  del(key: string): void {
    this.cache.delete(key);
  }

  /**
   * @summary
   * Clears all cache entries.
   *
   * @function clear
   * @module cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * @summary
   * Starts automatic cleanup of expired entries.
   *
   * @function startCleanup
   * @module cache
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, config.cache.checkPeriod * 1000);
  }

  /**
   * @summary
   * Stops automatic cleanup.
   *
   * @function stopCleanup
   * @module cache
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const weatherCache = new MemoryCache();
