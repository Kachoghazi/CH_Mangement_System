import React, { useEffect, useState } from "react";
import { User, LogOut, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Load user
  useEffect(() => {
    const savedUser = localStorage.getItem("authUser");
    if (savedUser) setUser(JSON.parse(savedUser));

    // listen login/logout changes
    const handler = () => {
      const u = localStorage.getItem("authUser");
      setUser(u ? JSON.parse(u) : null);
    };

    window.addEventListener("authChanged", handler);
    return () => window.removeEventListener("authChanged", handler);
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("authUser");
    window.dispatchEvent(new Event("authChanged"));
    navigate("/login");
  };

  return (
    <header style={styles.header}>
      <h2 style={styles.logo}>CodeHub</h2>

      <div style={styles.right}>
        {!user ? (
          <button style={styles.loginBtn} onClick={() => navigate("/login")}>
            <LogIn size={16} /> Login
          </button>
        ) : (
          <div style={styles.profile}>
            <User size={18} />
            <span>{user.name}</span>

            <div style={styles.dropdown}>
              <Link to="/profile">My Profile</Link>
              <button onClick={handleLogout}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

/* ===== styles ===== */
const styles = {
  header: {
    height: "60px",
    background: "#1e293b",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 25px",
  },
  logo: { margin: 0 },
  right: { display: "flex", alignItems: "center" },
  loginBtn: {
    background: "#4f46e5",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  profile: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  dropdown: {
    position: "absolute",
    top: "130%",
    right: 0,
    background: "white",
    color: "#000",
    borderRadius: "6px",
    padding: "10px",
    minWidth: "140px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
};
