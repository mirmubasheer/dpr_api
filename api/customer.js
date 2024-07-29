
require("dotenv").config();
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors")({
  origin: true,
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
});

// Define the customer schema and model
const customerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  comments: String,
});

const Customer = mongoose.model("Customer", customerSchema);

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

module.exports = (req, res) => {
  // Apply CORS middleware
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(200).send('OK');
      return;
    }

    if (req.method === 'POST') {
      try {
        const { name, email, phone, comments } = req.body;

        const customerData = { name, email, phone, comments };

        const customer = new Customer(customerData);
        await customer.save();

        const emailBody = `
          Customer Details:
          Name: ${customerData.name}
          Email: ${customerData.email}
          Phone: ${customerData.phone}
          Comments: ${customerData.comments}
        `;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: ["info@dprprop.com", "mirmubasheer558@gmail.com"],
          subject: "New Customer Form Submission",
          text: emailBody,
        });

           // Send data to Privyr
           const privyrWebhookURL = `https://www.privyr.com/api/v1/incoming-leads/${process.env.PRIVYR_STRING_1}`;
           const privyrPayload = {
             name: customerData.name,
             email: customerData.email,
             phone: customerData.phone,
             display_name: customerData.name,
             other_fields: {
               Address: customerData.address,
             },
           };

           await axios.post(privyrWebhookURL, privyrPayload, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

        res.status(200).json({ message: "Customer data saved successfully" });
      } catch (err) {
        console.error("Internal server error:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  });
};
