import 'module-alias/register'
import express from 'express'
import { router } from './Router'
import 'dotenv/config'
import { setupSwagger } from "../../../../Swagger"
import { corsConfig } from '../cors'
import { environment } from '../environment'

const app = express()

app.use(corsConfig)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/', router)
setupSwagger(app)

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

app.listen(port, () => {
  console.log('PROD: ', environment.isProd)
  console.log(`🚀 Server is running in http://localhost:${port}`)
  console.log(`📖 Docs: http://localhost:${port}/api-docs`)
})