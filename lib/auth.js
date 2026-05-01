import jwt from "jsonwebtoken";

export const createToken = (user) =>
  jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1d" });

export const verifyToken = (req) => {
  const token = req.headers.authorization;
  if (!token) throw "No token";
  return jwt.verify(token, process.env.JWT_SECRET);
};