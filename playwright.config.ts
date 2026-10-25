import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'allure-results',
        suiteTitle: true,
        environmentInfo: {
          framework: 'Playwright',
          project: 'LonApp API tests',
        },
      },
    ],
  ],
  use: {
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
  projects: [
    {
      name: 'dev',
      use: { baseURL: 'https://api.dev.lon-app.mindsprings.io' },
    },
    {
      name: 'staging',
      use: { baseURL: 'https://api.lon-app.mindsprings.io' },
    },
  ],
});
