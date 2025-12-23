/**
 * E2E Test Setup
 * Loads test environment variables before running tests
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
config({ path: resolve(__dirname, '../.env.test') });
