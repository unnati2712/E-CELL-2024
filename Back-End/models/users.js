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

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  isCertDownloadable: {
    type: String,
    default: false,
  },
  realName: {
    type: String,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
  },
  college: {
    type: String,
  },
  course: {
    type: String,
  },
  year: {
    type: String,
  },
  studentId: {
    type: String,
  },
  gender: {
    type: String,
  },
  city: {
    type: String,
  },
  events: [
    {
      eventId: {
        type: String,
      },
      teamId: {
        type: String,
      },
    },
  ],
});

const User = mongoose.model("User", userSchema);

export default User;
