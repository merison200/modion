import express from 'express';
import multer from 'multer';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getAllArticles,
  getFeaturedArticles,
  getArticleById,
  getArticlesByCategory,
  getCategories,
  createArticle,
  updateArticle,
  deleteArticle,
  searchArticles
} from '../controllers/articleController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory as buffer
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Public routes
router.get('/', getAllArticles);
router.get('/featured', getFeaturedArticles);
router.get('/search', searchArticles);
router.get('/categories', getCategories);
router.get('/category/:category', getArticlesByCategory);
router.get('/:id', getArticleById);

// Protected routes with file upload
router.post('/', protect, upload.single('image'), createArticle);
router.put('/:id', protect, upload.single('image'), updateArticle);
router.delete('/:id', protect, deleteArticle);

export default router;