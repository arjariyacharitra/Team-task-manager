import { connectDB } from "@/lib/db";
import Task from "@/models/Task";

export default async function handler(req, res) {
  await connectDB();

  const { id, status } = req.body;

  const updated = await Task.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  res.json(updated);
}