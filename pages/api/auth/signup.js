import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  await connectDB();

  const { name, email, password, role } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hash,
    role
  });

  res.json(user);
}