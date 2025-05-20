import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://vicsicard:Z6T46srM9kEGZfLJ@cluster0.tfi0dul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_DB = process.env.MONGODB_DB || "new-self-website-5-15-25";

/**
 * Image retrieval handler for serving images from GridFS
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client = null;
  
  try {
    const { id } = req.query;
    
    // Validate the ID format
    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }

    // Create ObjectId from the ID string
    const fileId = new ObjectId(id);
    
    // Connect to MongoDB
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB);
    
    // Create GridFS bucket
    const bucket = new GridFSBucket(db, {
      bucketName: 'images'
    });

    // Find file metadata first
    const files = db.collection('images.files');
    const file = await files.findOne({ _id: fileId });
    
    // If file doesn't exist, return 404
    if (!file) {
      if (client) await client.close();
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set cache control headers (cache for 30 days)
    res.setHeader('Cache-Control', 'public, max-age=2592000');
    res.setHeader('ETag', `"${id}"`);
    
    // Set content type based on file metadata
    const contentType = file.metadata?.contentType || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Set content disposition for better browser handling
    const filename = file.metadata?.originalName || 'image';
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Create a download stream for the file
    const downloadStream = bucket.openDownloadStream(fileId);
    
    // Log the start of streaming
    console.log(`Streaming image ${id} (${contentType}) from GridFS`);
    
    // Handle errors on the download stream
    downloadStream.on('error', (error) => {
      console.error(`Error streaming file ${id}:`, error);
      // Only send error response if headers haven't been sent yet
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file', message: error.message });
      }
    });

    // Handle successful completion
    downloadStream.on('end', () => {
      console.log(`Finished streaming image ${id}`);
    });

    // Pipe the file to the response
    downloadStream.pipe(res);
    
    // Close connection when the response ends
    res.on('close', () => {
      if (client) {
        client.close().catch(err => {
          console.error('Error closing MongoDB connection:', err);
        });
      }
    });
    
  } catch (error) {
    console.error('Error retrieving file:', error);
    // Close MongoDB connection if error occurs
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError);
      }
    }
    return res.status(500).json({ error: 'Failed to retrieve image', message: error.message });
  }
}
