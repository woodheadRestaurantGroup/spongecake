import dotenv from 'dotenv'

// Tests always run against test.env, never a developer's .env.local.
dotenv.config({ path: 'test.env', override: true })
