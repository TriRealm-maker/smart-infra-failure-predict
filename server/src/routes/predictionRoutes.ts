import { Router } from 'express';
import { getPrediction, getGuide } from '../controllers/predictionController';

const router = Router();

router.get('/prediction', getPrediction);
router.get('/guide', getGuide);

export default router;
