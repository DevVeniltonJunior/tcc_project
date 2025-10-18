import 'dotenv/config'

export const environment = {
  isProd: process.env.PROD === 'true',
  frontendUrl: process.env.FRONTEND_URL || 'Missing frontend URL',
}

