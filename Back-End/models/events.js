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

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  registrationActive: {
    type: Boolean,
    default: false,
  },
  price: {
    type: String,
    required: true,
  },
  poster: {
    type: String,
    required: true,
  },
  rules: {
    type: String,
    required: true,
  },
  teamSize: {
    type: Number,
    required: true,
  },
  minMembers: {
    type: Number,
    required: true,
  },
  maxNumberOfTeams: {
    type: Number,
    required: true,
  },
  description: {
    type: [{}], // Array of objects, change the schema according to the structure of the description
    required: true,
  },
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
