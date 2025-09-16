// Simple UPI config endpoint for Render-compatible backend
module.exports = async (req, res) => {
  // You can update these details as needed
  const upiDetails = {
    upiId: "your-upi-id@okphonepe",
    name: "SHREST MAHOTSAV",
    amount: 100, // You can make this dynamic if needed
    note: "Event Registration Fee"
  };
  res.json({ success: true, upi: upiDetails });
};
