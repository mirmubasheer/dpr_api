require("dotenv").config();
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const cpSchema = new mongoose.Schema({
  cpname: { type: String, required: true },
  cpaddress: String,
  cpemail: String,
  cpmobilenumber: String,
});

const Cp = mongoose.model("Cp", cpSchema);

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Connect to MongoDB when the application starts
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the application if MongoDB connection fails
  });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://dprprop.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { cpname, cpaddress, cpemail, cpmobilenumber } = req.body;

      const cpData = { cpname, cpaddress, cpemail, cpmobilenumber };

      const cp = new Cp(cpData);
      await cp.save();

      const emailBody = `
        CP Details:
        CP Name: ${cpData.cpname}
        CP Email: ${cpData.cpemail}
        CP Mobile Number: ${cpData.cpmobilenumber}
        CP Address: ${cpData.cpaddress}
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: ["info@dprprop.com", "mirmubasheer558@gmail.com"],
        subject: "New CP Form Submission",
        text: emailBody,
      });

      res.status(200).json({ message: "CP data saved successfully" });
    } catch (err) {
      console.error("Internal server error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
