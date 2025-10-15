import 'module-alias/register'
import { Router, Request, Response } from 'express'
import { TCreateBill, TCreateUser, TDeleteBill, TDeleteUser, TFindUser, TListBill, TListUser, TUpdateBill, TUpdateUser, TFindBill, TCreatePassword, TListPlanning, TFindPlanning, TDeletePlanning, TUpdatePlanning, TCreatePlanning, TForgotPassword, TResetPassword, TRegister, TLogin } from '@/presentation/protocols'
import { CreatePasswordController, CreatePlanningController, CreateUserController, DeletePlanningController, DeleteUserController, FindBillController, FindPlanningController, FindUserController, ListBillController, ListPlanningController, ListUserController, UpdatePlanningController, UpdateUserController, CreateBillController, UpdateBillController, DeleteBillController, ForgotPasswordController, ResetPasswordController, RegisterController, LoginController } from '@/presentation/controllers'

export const router = Router()

router.use((req, res, next) => {
  console.log('Time: ', Date.now())
  next()
})

router.get('/hello', (req, res) => {
  res.send({'message': 'Hello, Cognum!'})
})

router.post('/register', async (req: Request<any, any, any, TRegister.Request.body>, res: Response) => {
  const response = await RegisterController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.post('/login', async (req: Request<any, any, any, TLogin.Request.body>, res: Response) => {
  const response = await LoginController.handle(req)
  res.status(response.statusCode).json(response.data)
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

router.post('/password', async (req: Request<any, any, any, TCreatePassword.Request.body>, res: Response) => {
  const response = await CreatePasswordController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.post('/forgot-password', async (req: Request<any, any, any, TForgotPassword.Request.query>, res: Response) => {
  const response = await ForgotPasswordController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.post('/reset-password', async (req: Request<any, any, TResetPassword.Request.body, TResetPassword.Request.query>, res: Response) => {
  const response = await ResetPasswordController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.post('/bills', async (req: Request<any, any, any, TCreateBill.Request.body>, res: Response) => {
  const response = await CreateBillController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.put('/bills', async (req: Request<any, any, any, TUpdateBill.Request.body>, res: Response) => {
  const response = await UpdateBillController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.delete('/bills/:id', async (req: Request<any, any, any, TDeleteBill.Request.query>, res: Response) => {
  const response = await DeleteBillController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.get('/bill', async (req: Request<any, any, any, TFindBill.Request.query>, res: Response) => {
  const response = await FindBillController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.get('/bills', async (req: Request<any, any, any, TListBill.Request.query>, res: Response) => {
  const response = await ListBillController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.post('/plannings', async (req: Request<any, any, any, TCreatePlanning.Request.body>, res: Response) => {
  const response = await CreatePlanningController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.put('/plannings', async (req: Request<any, any, any, TUpdatePlanning.Request.body>, res: Response) => {
  const response = await UpdatePlanningController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.delete('/plannings/:id', async (req: Request<any, any, any, TDeletePlanning.Request.query>, res: Response) => {
  const response = await DeletePlanningController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.get('/planning', async (req: Request<any, any, any, TFindPlanning.Request.query>, res: Response) => {
  const response = await FindPlanningController.handle(req)
  res.status(response.statusCode).json(response.data)
})

router.get('/plannings', async (req: Request<any, any, any, TListPlanning.Request.query>, res: Response) => {
  const response = await ListPlanningController.handle(req)
  res.status(response.statusCode).json(response.data)
})
