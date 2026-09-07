import { Router } from 'express'
import {
  getAuthConfig,
  getCurrentUser,
  loginWithGoogle,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.get('/config', getAuthConfig)
router.post('/google', loginWithGoogle)
router.get('/me', requireAuth, getCurrentUser)

export default router
