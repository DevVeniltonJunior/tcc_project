import 'module-alias/register'
import express from 'express'
import { router } from './Router'
import 'dotenv/config'
import { setupSwagger } from "../../../../Swagger"

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/', router)
setupSwagger(app)

app.listen(3000, () => {
  console.log('🚀 Server is running in http://localhost:3000')
  console.log("📖 Docs: http://localhost:3000/api-docs")
})