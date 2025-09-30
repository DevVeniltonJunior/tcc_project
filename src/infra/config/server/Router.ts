import 'module-alias/register'
import { Router, Request, Response } from 'express'
import { TCreateUser, TDeleteUser, TFindUser, TListUser, TUpdateUser } from '@/presentation/protocols'
import { CreateUserController, DeleteUserController, FindUserController, ListUserController, UpdateUserController } from '@/presentation/controllers'

export const router = Router()

router.use((req, res, next) => {
  console.log('Time: ', Date.now())
  next()
})

router.get('/hello', (req, res) => {
  res.send({'message': 'Hello, Cognum!'})
})

router.post('/users', async (req: Request<any, any, any, TCreateUser.Request.body>, res: Response) => {
  const response = await CreateUserController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.put('/users', async (req: Request<any, any, any, TUpdateUser.Request.body>, res: Response) => {
  const response = await UpdateUserController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.delete('/users/:id', async (req: Request<any, any, any, TDeleteUser.Request.query>, res: Response) => {
  const response = await DeleteUserController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.get('/user', async (req: Request<any, any, any, TFindUser.Request.query>, res: Response) => {
  const response = await FindUserController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.get('/users', async (req: Request<any, any, any, TListUser.Request.query>, res: Response) => {
  const response = await ListUserController.handle(req)
  res.status(response.statusCode).json(response.data)
})
