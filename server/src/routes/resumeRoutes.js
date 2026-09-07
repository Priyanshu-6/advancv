import { Router } from 'express'
import {
  createResume,
  deleteResume,
  duplicateResume,
  getPublicResume,
  getResume,
  listResumes,
  setResumeVisibility,
  updateResume,
} from '../controllers/resumeController.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// Public read for shared resumes. Declared before the auth middleware so it
// stays reachable without a token.
router.get('/public/:resumeId', getPublicResume)

router.use(requireAuth)

router.route('/').get(listResumes).post(createResume)

router
  .route('/:resumeId')
  .get(getResume)
  .patch(updateResume)
  .delete(deleteResume)

router.post('/:resumeId/duplicate', duplicateResume)
router.post('/:resumeId/share', setResumeVisibility)

export default router
