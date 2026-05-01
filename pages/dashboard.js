import { useEffect, useState } from "react";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  const token =
    typeof window !== "undefined" && localStorage.getItem("token");

  const load = async () => {
    const res = await fetch("/api/task/get");
    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    await fetch("/api/task/create", {
      method: "POST",
      body: JSON.stringify({ title }),
      headers: {
        "Content-Type": "application/json",
        Authorization: token
      }
    });
    load();
  };

  const update = async (id, status) => {
    await fetch("/api/task/update", {
      method: "POST",
      body: JSON.stringify({ id, status }),
      headers: { "Content-Type": "application/json" }
    });
    load();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>

      <input onChange={e => setTitle(e.target.value)} />
      <button onClick={add}>Add</button>

      {tasks.map(t => (
        <div key={t._id}>
          {t.title} - {t.status}
          <button onClick={() => update(t._id, "In Progress")}>Start</button>
          <button onClick={() => update(t._id, "Done")}>Done</button>
        </div>
      ))}
    </div>
  );
}