#!/usr/bin/env node

/**
 * yarn-safe wrapper
 *
 * This script serves as a controlled entry point for Yarn to ensure consistent
 * behavior across local development and CI environments.
 *
 * Purpose:
 * - Execute a pinned Yarn release (yarn-4.12.0.cjs) for reproducibility
 * - Disable immutable installs to allow lockfile updates during development
 *
 * The YARN_ENABLE_IMMUTABLE_INSTALLS variable is deleted to prevent yarn install
 * from failing when the lockfile needs updates. This is intentional for this
 * monorepo's workflow where we want flexibility during development.
 */

delete process.env.YARN_ENABLE_IMMUTABLE_INSTALLS;
require('./yarn-4.12.0.cjs');
