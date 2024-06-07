require("dotenv").config();
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const customerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
});

const Cust = mongoose.model("Cust", customerSchema);

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

let isConnected;

async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return res.status(200).json({ message: "Customer endpoint is working!" });
  }

  if (req.method === 'POST') {
    try {
      await connectToDatabase();

      const cust = new Cust(req.body);
      const custDoc = await cust.save();

      const emailBody = `
        Customer Details:
        Name: ${req.body.name}
        Email: ${req.body.email}
        Phone: ${req.body.phone}
        Address: ${req.body.address}
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: ["info@dprprop.com", "mirmubasheer558@gmail.com"],
        subject: "New Customer Form Submission",
        text: emailBody,
      });

      res.status(200).json({ message: "Customer data saved successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
