require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

// Set up CORS middleware
const corsOptions = {
  origin: 'https://dprprop.com',
  methods: 'POST',
  allowedHeaders: ['Content-Type'],
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// Add other middleware and routes
app.use(express.json()); // Parse JSON bodies

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(error => {
  console.error("MongoDB connection error:", error);
  process.exit(1); // Exit the process if MongoDB connection fails
});

// Define your schema and model
const businessSchema = new mongoose.Schema({
  businessName: String,
  businessCategory: String,
  businessEmail: String,
  businessPhone: String,
});

const Business = mongoose.model("Business", businessSchema);

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Define your endpoint
app.post("/business", async (req, res) => {
  try {
    const { businessCategory } = req.body;
    let businessData = req.body;

    if (businessCategory === "Other") {
      const { businessName, businessEmail, businessPhone, otherCategory } = req.body;
      businessData = {
        businessName,
        businessEmail,
        businessPhone,
        businessCategory: otherCategory
      };
    }

    const business = new Business(businessData);
    const businessDoc = await business.save();

    const emailBody = `
      Business Details:
      Business Name: ${businessData.businessName}
      Business Email: ${businessData.businessEmail}
      Business Phone: ${businessData.businessPhone}
      Business Category: ${businessData.businessCategory}
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: ["info@dprprop.com", "mirmubasheer558@gmail.com"],
      subject: "New Business Form Submission",
      text: emailBody,
    });

    res.status(200).json({ message: "Business data saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
