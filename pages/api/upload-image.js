import { IncomingForm } from 'formidable';
import { MongoClient, GridFSBucket } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Configure for parsing form data with files
export const config = {
  api: {
    bodyParser: false,
  },
};

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://vicsicard:Z6T46srM9kEGZfLJ@cluster0.tfi0dul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_DB = process.env.MONGODB_DB || "new-self-website-5-15-25";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming form
    const form = new IncomingForm({
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      keepExtensions: true,
    });

    // Parse form and handle the file
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Get the file
    const file = files.image;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB);
    
    // Create GridFS bucket
    const bucket = new GridFSBucket(db, {
      bucketName: 'images'
    });

    // Upload file to GridFS
    const uploadStream = bucket.openUploadStream(file.originalFilename, {
      metadata: {
        contentType: file.mimetype,
        uploadDate: new Date()
      }
    });

    const fileStream = fs.createReadStream(file.filepath);
    
    // Handle the upload
    await new Promise((resolve, reject) => {
      fileStream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    // Generate image URL
    const fileId = uploadStream.id.toString();
    const imageUrl = `/api/images/${fileId}`;

    // Close connection
    await client.close();
    
    // Return the URL to the client
    return res.status(200).json({ 
      success: true, 
      fileId: fileId,
      url: imageUrl 
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
}
