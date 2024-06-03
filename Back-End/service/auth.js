import jwt from "jsonwebtoken";
import "dotenv/config";
const secret = process.env.JWT_SECRET;
export function setUser(user) {
  return jwt.sign(
    {
      _id: user._id.toString(),
      email: user.email,
    },
    secret,
    { expiresIn: "2d" }
  );
}

export function getUser(token) {
  if (!token) return null;
  return jwt.verify(token, secret);
}

