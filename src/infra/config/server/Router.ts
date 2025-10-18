import 'module-alias/register'
import { Router, Request, Response } from 'express'
import { TCreateBill, TCreateUser, TDeleteBill, TDeleteUser, TFindUser, TListBill, TListUser, TUpdateBill, TUpdateUser, TFindBill, TCreatePassword, TListPlanning, TFindPlanning, TDeletePlanning, TUpdatePlanning, TCreatePlanning, TGeneratePlanning, TForgotPassword, TResetPassword, TRegister, TLogin } from '@/presentation/protocols'
import { CreatePasswordController, CreatePlanningController, CreateUserController, DeletePlanningController, DeleteUserController, FindBillController, FindPlanningController, FindUserController, ListBillController, ListPlanningController, ListUserController, UpdatePlanningController, UpdateUserController, CreateBillController, UpdateBillController, DeleteBillController, ForgotPasswordController, ResetPasswordController, RegisterController, LoginController, GeneratePlanningController } from '@/presentation/controllers'
import { AuthMiddleware, AuthenticatedRequest } from '@/presentation/middlewares'
import { environment } from '@/infra/config'
import { GetUserSummaryController } from '@/presentation/controllers/GetUserSummaryController'

export const router = Router()

if (!environment.isProd) {
  router.use((req, res, next) => {
    console.log('Time: ', Date.now())
    next()
  })
}

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

// Protected routes - require authentication
router.post('/users', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await CreateUserController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.put('/users', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await UpdateUserController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.delete('/users/:id', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await DeleteUserController.handle({ body: req.body, params: req.params as any, query: req.query as any, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.get('/user', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await FindUserController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.get('/user-summary', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await GetUserSummaryController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.get('/users', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await ListUserController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.post('/password', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await CreatePasswordController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
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

router.post('/bills', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await CreateBillController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.put('/bills', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await UpdateBillController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.delete('/bills/:id', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await DeleteBillController.handle({ body: req.body, params: req.params as any, query: req.query as any, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.get('/bill', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await FindBillController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.get('/bills', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await ListBillController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.post('/plannings', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await CreatePlanningController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.post('/generate-planning', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await GeneratePlanningController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.put('/plannings', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await UpdatePlanningController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.delete('/plannings/:id', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await DeletePlanningController.handle({ body: req.body, params: req.params as any, query: req.query as any, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.get('/planning', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await FindPlanningController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})

router.get('/plannings', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const response = await ListPlanningController.handle({ body: req.body, params: req.params, query: req.query, userId: req.userId })
  res.status(response.statusCode).json(response.data)
})
