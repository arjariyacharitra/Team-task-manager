import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { verifyToken } from "@/lib/auth";

export default async function handler(req, res) {
  await connectDB();

  const user = verifyToken(req);

  const task = await Task.create({
    ...req.body,
    assignedTo: req.body.assignedTo || user.id
  });

  res.json(task);
}