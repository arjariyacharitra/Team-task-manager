import { connectDB } from "@/lib/db";
import Task from "@/models/Task";

export default async function handler(req, res) {
  await connectDB();

  const tasks = await Task.find();
  res.json(tasks);
}