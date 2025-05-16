// Health check endpoint for keep-alive
export default function handler(req, res) {
  // Return a simple success response
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}
