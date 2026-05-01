import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export default async function handler(req, res) {
  await connectDB();
  const data = await Project.find();
  res.json(data);
}