import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://vicsicard:Z6T46srM9kEGZfLJ@cluster0.tfi0dul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_DB = process.env.MONGODB_DB || "new-self-website-5-15-25";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB);
    
    // Create GridFS bucket
    const bucket = new GridFSBucket(db, {
      bucketName: 'images'
    });

    // Find file metadata
    const files = db.collection('images.files');
    const file = await files.findOne({ _id: new ObjectId(id) });
    
    if (!file) {
      await client.close();
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate content type
    res.setHeader('Content-Type', file.metadata?.contentType || 'application/octet-stream');
    
    // Create a download stream
    const downloadStream = bucket.openDownloadStream(new ObjectId(id));
    
    // Handle errors on the download stream
    downloadStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({ error: 'Error streaming file' });
    });

    // Pipe the file to the response
    downloadStream.pipe(res);
    
    // Close connection when the response ends
    res.on('close', () => {
      client.close().catch(console.error);
    });
    
  } catch (error) {
    console.error('Error retrieving file:', error);
    return res.status(500).json({ error: 'Failed to retrieve file' });
  }
}
