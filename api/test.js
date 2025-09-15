module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'SHREST MAHOTSAV API is working!', 
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};