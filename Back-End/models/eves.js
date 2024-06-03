import mongoose, { Schema, connect } from "mongoose";
import "dotenv/config";

const dbUrl = process.env.DB_URL;

main().catch((err) => console.log(err));
async function main() {
  await connect(dbUrl);
  console.log("Mongo Connection Open!!!");
}

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Database connected");
});

const eveSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  email: {
    type: String,
  },
  libId: {
    type: String,
  },

  amount: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["FAILED", "SUCCESS", "ABONDONED"],
  },
  razorpay_order_id: {
    type: String,
  },
  razorpay_payment_id: {
    type: String,
  },
  razorpay_signature: {
    type: String,
  },
  paidBy: {
    type: String,
  },
});

// Create and export the Payment model
const Eve = mongoose.model("Eve", eveSchema);

export default Eve;
