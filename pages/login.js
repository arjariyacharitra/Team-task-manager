import { useState } from "react";

export default function Login() {
  const [data, setData] = useState({});

  const login = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });

    const r = await res.json();
    localStorage.setItem("token", r.token);
    location.href = "/dashboard";
  };

  return (
    <div>
      <input placeholder="Email" onChange={e => setData({...data, email:e.target.value})}/>
      <input type="password" placeholder="Password" onChange={e => setData({...data, password:e.target.value})}/>
      <button onClick={login}>Login</button>
    </div>
  );
}