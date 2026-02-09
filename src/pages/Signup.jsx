import React from "react";
import { Link, useNavigate } from "react-router-dom";

function SignUp() {
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    // yahan baad mein API signup lagegi
    navigate("/");
  };

  return (
    <div>
      <h2>Sign Up</h2>

      <form onSubmit={handleSignup}>
        <input type="text" placeholder="Full Name" required />
        <br /><br />
        <input type="email" placeholder="Email" required />
        <br /><br />
        <input type="password" placeholder="Password" required />
        <br /><br />
        <button type="submit">Register</button>
      </form>

      <p>
        Already account hai? <Link to="/">Sign In</Link>
      </p>
    </div>
  );
}

export default SignUp;
