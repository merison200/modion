import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: false,
  },
  title: {
    type: String,
    required: false,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['paragraph', 'heading', 'list', 'quote', 'code'],
    required: false,
  }
}, { _id: false });

const articleSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'business',
      'fashion',
      'ideas',
      'lifestyle',
      'design',
      'Technology',
      'creative',
      'story'
    ],
  },
  image: {
    type: String,
    required: true,
  },
  imagePublicId: {
    type: String,
    required: false,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reading_time: {
    type: String,
    required: true,
    match: /^\d+\smin\sread$/,
  },
  sections: {
    type: [sectionSchema],
    required: true,
    validate: {
      validator: function (sections) {
        return Array.isArray(sections) && sections.length > 0;
      },
      message: 'At least one section is required.',
    },
  },
  tags: {
    type: [String],
    default: [],
  },
  meta_description: {
    type: String,
    maxlength: 10000,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
  }
}, {
  timestamps: true
});

const Article = mongoose.model('Article', articleSchema);

export default Article;