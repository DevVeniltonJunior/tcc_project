import cors from 'cors'
import { environment } from '../environment'

export const corsConfig = cors({
  origin: environment.isProd 
    ? environment.frontendUrl 
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

