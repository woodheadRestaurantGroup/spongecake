import { execSync } from 'child_process'
import dotenv from 'dotenv'
import fs from 'fs'

/**
 * Runs once before the test suite: applies pending migrations to the test
 * database so every test file starts from the current schema.
 *
 * Delegates to the Payload CLI in a child process because migrations are
 * TypeScript files that Payload loads with its own loader, which does not
 * work from inside the Vitest runtime.
 */
export default function setup(): void {
  const testEnv = dotenv.parse(fs.readFileSync('test.env'))
  execSync('pnpm payload migrate', {
    stdio: 'inherit',
    env: { ...process.env, ...testEnv, PAYLOAD_MIGRATING: 'true' },
  })
}
