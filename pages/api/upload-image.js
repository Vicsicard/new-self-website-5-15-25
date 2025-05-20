import { IncomingForm } from 'formidable';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import fs from 'fs';
import { Readable } from 'stream';

// Configure for parsing form data with files
export const config = {
  api: {
    bodyParser: false,
  },
};

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://vicsicard:Z6T46srM9kEGZfLJ@cluster0.tfi0dul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_DB = process.env.MONGODB_DB || "new-self-website-5-15-25";

/**
 * Parse multipart form data with formidable
 * @param {object} req - HTTP request object
 * @returns {Promise<object>} - Parsed form data with fields and files
 */
const parseFormData = (req) => {
  const options = {
    maxFileSize: 5 * 1024 * 1024, // 5MB limit
    keepExtensions: true,
    multiples: false,
    uploadDir: '/tmp' // Use temp directory for serverless environment
  };
  
  return new Promise((resolve, reject) => {
    const form = new IncomingForm(options);
    
    // Handle file specifically
    let uploadedFile = null;
    
    form.on('file', (field, file) => {
      console.log('Received file:', { field, name: file.originalFilename, size: file.size, type: file.mimetype });
      uploadedFile = file;
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        return reject(err);
      }
      
      // Pass both the parsed files and our specifically handled file
      resolve({ 
        fields, 
        files, 
        uploadedFile 
      });
    });
  });
};

/**
 * Upload image handler for POST requests
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client = null;
  
  try {
    console.log('Processing image upload request');
    
    // Parse the multipart form data with our enhanced method
    const { fields, files, uploadedFile } = await parseFormData(req);
    console.log('Form parsed, files:', Object.keys(files));
    
    // Use the directly captured file object which preserves all properties
    const file = uploadedFile;
    
    if (!file) {
      console.error('No valid file found in request');
      return res.status(400).json({ error: 'No file uploaded or invalid file format' });
    }
    
    console.log('Using file:', { 
      name: file.originalFilename, 
      type: file.mimetype, 
      size: file.size,
      path: file.filepath
    });
    
    // Validate file type
    // Include various JPEG format types including JFIF
    const validTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/pjpeg', 
      'image/jfif', 
      'image/png', 
      'image/gif', 
      'image/webp'
    ];
    
    console.log('File MIME type:', file.mimetype);
    
    // Handle special cases for JFIF
    let fileType = file.mimetype;
    if (file.originalFilename?.toLowerCase().endsWith('.jpg') || 
        file.originalFilename?.toLowerCase().endsWith('.jpeg')) {
      // Force accept the file if it has jpg/jpeg extension regardless of mimetype
      console.log('Accepting file based on .jpg/.jpeg extension');
      fileType = 'image/jpeg';
    }
    
    if (!validTypes.includes(fileType)) {
      console.error('Invalid file type:', fileType, 'Filename:', file.originalFilename);
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPG, PNG, GIF and WebP images are allowed.',
        receivedType: fileType
      });
    }

    // Read file into buffer first (more reliable in serverless environments)
    let fileBuffer;
    try {
      fileBuffer = fs.readFileSync(file.filepath);
      console.log('File read into buffer, size:', fileBuffer.length);
    } catch (readErr) {
      console.error('Error reading file:', readErr);
      return res.status(500).json({ error: 'Failed to read uploaded file' });
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB);
    console.log('Connected to MongoDB database:', MONGODB_DB);
    
    // Create GridFS bucket
    const bucket = new GridFSBucket(db, {
      bucketName: 'images'
    });

    // Safe filename
    const filename = file.originalFilename || 'unnamed-image-' + Date.now();
    
    // Create upload stream
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        contentType: file.mimetype,
        uploadDate: new Date(),
        originalName: filename,
        fileSize: file.size
      }
    });
    
    // Create buffer stream
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null); // Signal end of stream
    
    // Upload to GridFS
    console.log('Uploading file to GridFS...');
    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(uploadStream)
        .on('error', (err) => {
          console.error('GridFS upload error:', err);
          reject(err);
        })
        .on('finish', () => {
          console.log('GridFS upload complete');
          resolve();
        });
    });

    // Generate image URL
    const fileId = uploadStream.id.toString();
    const imageUrl = `/api/images/${fileId}`;
    console.log('File uploaded successfully with ID:', fileId);

    // Cleanup temp file
    try {
      fs.unlinkSync(file.filepath);
      console.log('Temporary file cleaned up');
    } catch (cleanupErr) {
      console.warn('Warning: Could not clean up temp file:', cleanupErr);
      // Continue anyway, not critical
    }

    // Return success response with URL
    const response = {
      success: true,
      fileId: fileId,
      url: imageUrl,
      filename: filename,
      type: file.mimetype,
      size: file.size
    };
    
    console.log('Response:', response);
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ 
      error: 'Failed to upload file', 
      message: error.message || 'Unknown error'
    });
  } finally {
    // Always close MongoDB connection
    if (client) {
      try {
        await client.close();
        console.log('MongoDB connection closed');
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
      }
    }
  }
}
