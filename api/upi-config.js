// Simple UPI config endpoint for Render-compatible backend
module.exports = async (req, res) => {
  // Return fields as expected by frontend
  const upiDetails = {
    pa: "6305369920@ybl", // UPI ID
    pn: "TATA ANANTHA VENKATA", // Name
    amount: 100, // You can make this dynamic if needed
    note: "SHREST-MAHOTSAV_2K25 Registration Fee"
  };
  res.json({ success: true, ...upiDetails });
};
