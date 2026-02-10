/**
 * Festival Configuration System for Backend
 *
 * This module provides a centralized configuration system for festival-specific values.
 * Configuration is loaded from environment variables.
 */

export interface FestivalConfig {
  // Basic festival information
  name: string;
  slug: string;

  // API metadata
  apiTitle: string;
  apiDescription: string;
  apiVersion: string;
}

/**
 * Loads festival configuration from environment variables
 */
export const loadFestivalConfig = (): FestivalConfig => {
  return {
    name: process.env.FESTIVAL_NAME || 'Big Fam Festival',
    slug: process.env.FESTIVAL_SLUG || 'bigfam-festival',
    apiTitle: process.env.API_TITLE || 'Big Fam Festival API',
    apiDescription:
      process.env.API_DESCRIPTION || 'API for the Big Fam Festival App',
    apiVersion: process.env.API_VERSION || '1.0',
  };
};

// Export the loaded configuration
export const festivalConfig = loadFestivalConfig();
