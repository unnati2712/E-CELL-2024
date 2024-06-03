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

const stdPassSchema = new Schema({
  stdPassPrice: String,
  stdPassDes: String,
  stdPassPoster: String,
  stdPassRules: String,
});

const StdPass = mongoose.model("StdPass", stdPassSchema);

export default StdPass;