import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.TV_E2E_PORT || 8123);

// Cada prueba corre la misma interacción en la TV actual (/woki-os.html) y en la v2 (/v2/),
// con los backends simulados por page.route(). Sin red real, sin LLM y sin WhatsApp.
// Requiere `npm run build` antes (npm run e2e lo hace).
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  expect: { timeout: 6_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1600, height: 1000 },
    locale: 'es-CL',
    trace: 'retain-on-failure',
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
  projects: [
    {
      name: 'paridad',
      testIgnore: /myoware\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 1000 } },
    },
    // MyoWare descarta paquetes con más de 250 ms de viaje (igual que la TV real): corre al final, sin competir por CPU.
    {
      name: 'myoware',
      testMatch: /myoware\.spec\.ts/,
      dependencies: ['paridad'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 1000 } },
    },
  ],
  webServer: {
    command: `node e2e/serve.mjs ${PORT}`,
    url: `http://localhost:${PORT}/woki-os.html`,
    reuseExistingServer: !process.env.CI,
  },
});
