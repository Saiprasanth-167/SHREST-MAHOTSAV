// UPI config endpoint for Vercel serverless
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Return UPI details
  const upiDetails = {
    pa: "6305369920@ybl",
    pn: "TATA ANANTHA VENKATA",
    amount: 100,
    note: "SHREST-MAHOTSAV_2K25 Registration Fee"
  };
  
  res.status(200).json({ success: true, ...upiDetails });
};
