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

const teamSchema = new mongoose.Schema({
  leaderId: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
  },
  teamName: {
    type: String,
    required: true,
  },
  teamMembers: {
    type: [String],
    required: true,
  },
  eventId: {
    type: String,
    required: true,
  },
  paymentCompleted: {
    type: Boolean,
    default: false,
  },
});

// Create and export the Team model
const Team = mongoose.model("Team", teamSchema);

export default Team;
