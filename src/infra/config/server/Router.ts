import 'module-alias/register'
import { Router, Request, Response } from 'express'

export const router = Router()

router.use((req, res, next) => {
  console.log('Time: ', Date.now())
  next()
})

router.get('/hello', (req, res) => {
  res.send({'message': 'Hello, Cognum!'})
})
