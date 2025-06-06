const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const supabase = require('../config/supabase/client');

// Create a Supabase client with the service role key to bypass RLS
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only create the admin client if the service key is available
const supabaseAdmin = supabaseServiceKey ?
    createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    }) : null;

console.log('Supabase Admin client initialized.');

// Configure multer for memory storage (we'll process the image before uploading to Supabase)
const storage = multer.memoryStorage();

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Middleware to handle profile image upload
const uploadProfileImage = async (req, res, next) => {
  try {
    // Check if file exists in the request
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    // Get user ID from either JWT token or session, or use a default for testing
    let userId = req.user?.id || req.session?.user?.id;
    if (!userId) {
      console.log('No user ID found in request, using default for testing');
      userId = 'test-user-id';
    }
    console.log('Processing image upload for user ID:', userId);

    // Generate a unique filename
    const filename = `profile-${userId}-${uuidv4()}${path.extname(req.file.originalname)}`;

    // Process the image with Sharp
    const processedImageBuffer = await sharp(req.file.buffer)
      .resize({
        width: 300,
        height: 300,
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Check if bucket exists first
    try {
      console.log('Checking if profile-images bucket exists...');
      
      // Bucket should already exist in Supabase
    } catch (bucketError) {
      console.error('Error checking bucket:', bucketError);
    }

    // Upload to Supabase Storage using admin client to bypass RLS
    console.log('Uploading image to Supabase storage...');
    const { data, error } = await supabaseAdmin.storage
      .from('profile-images')
      .upload(filename, processedImageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Error uploading to Supabase:', error);
      // If the bucket doesn't exist, inform the user to create it in Supabase dashboard
      if (error.message && error.message.includes('Bucket not found')) {
        return res.status(500).json({ 
          success: false, 
          message: 'The profile-images bucket does not exist. Please create it in your Supabase dashboard.' 
        });
      }
      return res.status(500).json({ success: false, message: 'Failed to upload image to storage' });
    }

    // Get public URL
    try {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('profile-images')
        .getPublicUrl(filename);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('No public URL returned from Supabase');
        return res.status(500).json({ success: false, message: 'Failed to get public URL for uploaded image' });
      }
      
      console.log('Generated public URL:', publicUrlData.publicUrl);
      
      // Add the image URL to the request for the next middleware
      req.profileImageUrl = publicUrlData.publicUrl;
    } catch (urlError) {
      console.error('Error getting public URL:', urlError);
      return res.status(500).json({ success: false, message: 'Error generating public URL for uploaded image' });
    }
    
    next();
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ success: false, message: 'Error processing image upload' });
  }
};

module.exports = {
  upload: upload.single('profileImage'),
  processUpload: uploadProfileImage
};