// Simple UPI config endpoint for Render-compatible backend
module.exports = async (req, res) => {
  // You can update these details as needed
  const upiDetails = {
    upiId: "8374466616@ybl",
    name: "BOOMIREDDY BALA SIDDHARA REDDY",
    amount: 100, // You can make this dynamic if needed
    note: "SHREST-MAHOTSAV_2K25 Registration Fee"
  };
  res.json({ success: true, upi: upiDetails });
};
