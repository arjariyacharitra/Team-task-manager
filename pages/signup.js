import { useState } from "react";

export default function Signup() {
  const [data, setData] = useState({});

  const submit = async () => {
    await fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });
    alert("User created");
  };

  return (
    <div>
      <input placeholder="Name" onChange={e => setData({...data, name:e.target.value})}/>
      <input placeholder="Email" onChange={e => setData({...data, email:e.target.value})}/>
      <input type="password" placeholder="Password" onChange={e => setData({...data, password:e.target.value})}/>
      <button onClick={submit}>Signup</button>
    </div>
  );
}