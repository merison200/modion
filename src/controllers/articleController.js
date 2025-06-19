import Article from '../models/article.js';
import mongoose from 'mongoose';
import { uploadImage, updateImage, deleteImage, extractPublicId, generateRandomAvatar } from '../utils/cloudinaryUtils.js';

const transformArticle = (article) => ({
  id: article.id,
  title: article.title,
  category: article.category,
  image: article.image,
  author: article.author.name,
  author_image: generateRandomAvatar(article.author.name),
  reading_time: article.reading_time,
  sections: article.sections,
  tags: article.tags,
  meta_description: article.meta_description,
  featured: article.featured,
  status: article.status,
  createdAt: article.createdAt,
  updatedAt: article.updatedAt
});

// GET /api/articles - Get all published articles
export const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find({ status: 'published' })
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    const transformedArticles = articles.map(transformArticle);
    
    res.json(transformedArticles);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching articles', 
      error: error.message 
    });
  }
};

// GET /api/articles/featured - Get featured articles (for FeaturedPosts component)
export const getFeaturedArticles = async (req, res) => {
  try {
    const articles = await Article.find({ 
      status: 'published', 
      featured: true 
    })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(3); // Adjust limit as needed

    const transformedArticles = articles.map(transformArticle);
    
    res.json(transformedArticles);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching featured articles', 
      error: error.message 
    });
  }
};

// GET /api/articles/:id - Get single article by ID
export const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findOne({ 
      id: id, 
      status: 'published' 
    }).populate('author', 'name');

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const transformedArticle = transformArticle(article);
    
    res.json(transformedArticle);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching article', 
      error: error.message 
    });
  }
};

// GET /api/articles/category/:category - Get articles by category (for Tag component)
export const getArticlesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const articles = await Article.find({ 
      category: category, 
      status: 'published' 
    })
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    const transformedArticles = articles.map(transformArticle);
    
    res.json(transformedArticles);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching articles by category', 
      error: error.message 
    });
  }
};

// GET /api/categories - Get all categories with article counts (for TopTags component)
export const getCategories = async (req, res) => {
  try {
    const categories = await Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const formattedCategories = categories.map(cat => ({
      category: cat._id,
      count: cat.count
    }));
    
    res.json(formattedCategories);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
};

// Helper function to calculate reading time
const calculateReadingTime = (sections) => {
  if (!sections || !Array.isArray(sections)) return "1 min read";
  
  let totalWords = 0;
  
  sections.forEach(section => {
    if (section.content) {
      // Count words in content (simple word count)
      const words = section.content.trim().split(/\s+/).length;
      totalWords += words;
    }
    if (section.title) {
      // Count words in title too
      const titleWords = section.title.trim().split(/\s+/).length;
      totalWords += titleWords;
    }
  });
  
  // Average reading speed is 200-250 words per minute, using 200 for conservative estimate
  const readingTimeMinutes = Math.ceil(totalWords / 200);
  
  return `${readingTimeMinutes} min read`;
};

// POST /api/articles - Create new article (Admin/Author only)
// Note: This route should use multer middleware: upload.single('image')
export const createArticle = async (req, res) => {
  try {
    const articleData = { ...req.body };
    
    // Check if image file is provided
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // Parse JSON strings from FormData
    if (articleData.tags && typeof articleData.tags === 'string') {
      try {
        articleData.tags = JSON.parse(articleData.tags);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid tags format' });
      }
    }

    if (articleData.sections && typeof articleData.sections === 'string') {
      try {
        articleData.sections = JSON.parse(articleData.sections);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid sections format' });
      }
    }

    // Convert string booleans
    if (articleData.featured && typeof articleData.featured === 'string') {
      articleData.featured = articleData.featured === 'true';
    }

    // Auto-generate reading_time if not provided
    if (!articleData.reading_time) {
      articleData.reading_time = calculateReadingTime(articleData.sections);
    }

    // Upload image to Cloudinary - Pass the entire file object instead of just buffer
    const uploadResult = await uploadImage(req.file, 'articles');
    
    if (!uploadResult.success) {
      return res.status(400).json({ 
        message: 'Failed to upload image', 
        error: uploadResult.error 
      });
    }

    // Add image URL and author to article data
    articleData.image = uploadResult.url;
    articleData.imagePublicId = uploadResult.publicId; // Store for future deletion if needed
    articleData.author = req.user._id; //Set the authenticated user as author

    // Generate unique ID if not provided
    if (!articleData.id) {
      articleData.id = new mongoose.Types.ObjectId().toString();
    }

    const article = new Article(articleData);
    await article.save();

    // Populate author for response
    await article.populate('author', 'name');
    
    const transformedArticle = transformArticle(article);
    
    res.status(201).json(transformedArticle);
  } catch (error) {
    console.error('Create article error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Article ID already exists' });
    }
    res.status(400).json({ 
      message: 'Error creating article', 
      error: error.message 
    });
  }
};

// PUT /api/articles/:id - Update article
// Note: This route should use multer middleware: upload.single('image') (optional for updates)
export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Find existing article first
    const existingArticle = await Article.findOne({ id: id });
    if (!existingArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && existingArticle.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this article' });
    }

    // Parse JSON strings from FormData if they exist
    if (updateData.tags && typeof updateData.tags === 'string') {
      try {
        updateData.tags = JSON.parse(updateData.tags);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid tags format' });
      }
    }

    if (updateData.sections && typeof updateData.sections === 'string') {
      try {
        updateData.sections = JSON.parse(updateData.sections);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid sections format' });
      }
    }

    // Convert string booleans
    if (updateData.featured && typeof updateData.featured === 'string') {
      updateData.featured = updateData.featured === 'true';
    }

    // Auto-update reading_time if sections were modified
    if (updateData.sections) {
      updateData.reading_time = calculateReadingTime(updateData.sections);
    }

    // Handle image update if new image is provided
    if (req.file) {
      // Use the stored publicId if available, otherwise extract from URL
      const oldPublicId = existingArticle.imagePublicId || extractPublicId(existingArticle.image);
      
      // Use updateImage utility function - this handles deletion of old image AND upload of new image
      const updateResult = await updateImage(oldPublicId, req.file, 'articles');
      
      if (!updateResult.success) {
        return res.status(400).json({ 
          message: 'Failed to update image', 
          error: updateResult.error 
        });
      }

      // Add new image data to update
      updateData.image = updateResult.url;
      updateData.imagePublicId = updateResult.publicId;
    }

    // Update article in database
    const article = await Article.findOneAndUpdate(
      { id: id },
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name');

    const transformedArticle = transformArticle(article);
    
    res.json(transformedArticle);
  } catch (error) {
    console.error('Update article error:', error);
    res.status(400).json({ 
      message: 'Error updating article', 
      error: error.message 
    });
  }
};

// DELETE /api/articles/:id - Delete article
export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    // Find article first
    const article = await Article.findOne({ id: id });
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check authorization - MOVED after finding article
    if (req.user.role !== 'admin' && article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this article' });
    }

    // Delete image from Cloudinary
    // Use stored publicId if available, otherwise extract from URL
    const publicId = article.imagePublicId || extractPublicId(article.image);
    if (publicId) {
      const deleteResult = await deleteImage(publicId);
      if (!deleteResult.success) {
        console.warn('Failed to delete image from Cloudinary:', deleteResult.error);
        // Continue with article deletion anyway
      }
    }

    // Delete article from database
    await Article.findOneAndDelete({ id: id });

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ 
      message: 'Error deleting article', 
      error: error.message 
    });
  }
};

// GET /api/articles/search?q=query - Search articles
export const searchArticles = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const articles = await Article.find({
      status: 'published',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { 'sections.content': { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    })
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    const transformedArticles = articles.map(transformArticle);
    
    res.json(transformedArticles);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error searching articles', 
      error: error.message 
    });
  }
};