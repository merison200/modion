import { cloudinary } from '../config/cloudinary.js';

/**
 * Upload image to Cloudinary
 * @param {string|Buffer|Object} imageInput - File path, Buffer, or multer file object
 * @param {string} folder - Cloudinary folder to upload to (optional)
 * @param {string} publicId - Custom public ID for the image (optional)
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export const uploadImage = async (imageInput, folder = 'articles', publicId = null) => {
  try {
    const uploadOptions = {
      folder: folder,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    let uploadSource;

    // Handle different input types
    if (typeof imageInput === 'string') {
      // File path or base64 string
      uploadSource = imageInput;
    } else if (Buffer.isBuffer(imageInput)) {
      // Direct Buffer
      const b64 = imageInput.toString("base64");
      uploadSource = `data:image/jpeg;base64,${b64}`;
    } else if (imageInput && imageInput.buffer) {
      // Multer file object with buffer
      const b64 = Buffer.from(imageInput.buffer).toString("base64");
      const mimeType = imageInput.mimetype || 'image/jpeg';
      uploadSource = `data:${mimeType};base64,${b64}`;
    } else {
      throw new Error('Invalid image input type');
    }

    const result = await cloudinary.uploader.upload(uploadSource, uploadOptions);
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update existing image in Cloudinary
 * @param {string} oldPublicId - Public ID of the existing image to replace
 * @param {string|Buffer|Object} newImageInput - New image (path, Buffer, or multer file object)
 * @param {string} folder - Cloudinary folder (optional)
 * @returns {Promise<Object>} - Upload result
 */
export const updateImage = async (oldPublicId, newImageInput, folder = 'articles') => {
  try {
    // Delete old image first
    if (oldPublicId) {
      await deleteImage(oldPublicId);
    }

    // Upload new image
    const uploadResult = await uploadImage(newImageInput, folder);
    
    return uploadResult;
  } catch (error) {
    console.error('Cloudinary update error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} cloudinaryUrl - Full Cloudinary URL
 * @returns {string|null} - Public ID or null if invalid URL
 */
export const extractPublicId = (cloudinaryUrl) => {
  try {
    if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
      return null;
    }

    // Extract public ID from URL
    const urlParts = cloudinaryUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return null;
    
    // Get everything after version (if exists) or after upload
    let publicIdParts = urlParts.slice(uploadIndex + 1);
    
    // Remove version if it exists (starts with 'v' followed by numbers)
    if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
      publicIdParts = publicIdParts.slice(1);
    }
    
    // Join remaining parts and remove file extension
    const publicIdWithExtension = publicIdParts.join('/');
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

/**
 * Generate random avatar URL
 * @param {string} name - Name to use for avatar generation
 * @param {number} size - Avatar size (default: 100)
 * @returns {string} - Avatar URL
 */
export const generateRandomAvatar = (name, size = 100) => {
  // Using DiceBear API for consistent random avatars
  const styles = ['avataaars', 'big-smile', 'bottts', 'identicon', 'initials'];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  
  // Clean name for URL
  const cleanName = encodeURIComponent(name.replace(/\s+/g, ''));
  
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${cleanName}&size=${size}`;
};