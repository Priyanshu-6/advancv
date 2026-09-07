import { Router } from 'express'
import {
  postImprove,
  postJobMatch,
  postSkills,
  postSummary,
} from '../controllers/aiController.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { aiRateLimiter } from '../middleware/rateLimit.js'

const router = Router()

// Every AI route costs money per call, so require a session and rate limit.
router.use(requireAuth, aiRateLimiter)

router.post('/summary', postSummary)
router.post('/improve', postImprove)
router.post('/skills', postSkills)
router.post('/match', postJobMatch)

export default router
