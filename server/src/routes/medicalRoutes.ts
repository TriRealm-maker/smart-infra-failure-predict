import { Router, Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import { 
  getMedicalProfile, 
  updateMedicalProfile, 
  addMedicalFile, 
  deleteMedicalFile,
  generateShareLink,
  getSharedProfile 
} from '../controllers/medicalController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDF files are allowed'));
  },
});

const handleMulterError = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof MulterError || err.message.includes('Only images and PDF files are allowed')) {
    res.status(400).json({ message: err.message });
    return;
  }
  next(err);
};

router.get('/profile', authMiddleware, getMedicalProfile);
router.put('/profile', authMiddleware, updateMedicalProfile);
router.post('/upload', authMiddleware, upload.single('file'), handleMulterError, addMedicalFile);
router.delete('/files/:fileId', authMiddleware, deleteMedicalFile);
router.post('/share', authMiddleware, generateShareLink);
router.get('/share/:token', getSharedProfile);

export default router;
