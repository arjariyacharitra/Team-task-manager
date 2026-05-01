import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { verifyToken } from "@/lib/auth";

export default async function handler(req, res) {
  await connectDB();

  const user = verifyToken(req);
  if (user.role !== "Admin")
    return res.status(403).json({ msg: "Forbidden" });

  const project = await Project.create({
    ...req.body,
    createdBy: user.id
  });

  res.json(project);
}