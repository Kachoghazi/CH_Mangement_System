import React, { useEffect, useState } from "react";

function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("authUser")));

    const handler = () => {
      setUser(JSON.parse(localStorage.getItem("authUser")));
    };

    window.addEventListener("authChanged", handler);
    return () => window.removeEventListener("authChanged", handler);
  }, []);

  const logout = () => {
    localStorage.removeItem("authUser");
    window.dispatchEvent(new Event("authChanged"));
  };

  return (
    <nav className="main-header navbar navbar-expand navbar-white navbar-light">
      {/* LEFT */}
      <ul className="navbar-nav">
        <li className="nav-item">
          <span className="nav-link font-weight-bold">
            CodeHub Tech
          </span>
        </li>
      </ul>

      {/* RIGHT */}
      <ul className="navbar-nav ml-auto">
        {!user ? (
          <li className="nav-item">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => (window.location.href = "/login")}
            >
              Login
            </button>
          </li>
        ) : (
          <>
            <li className="nav-item">
              <span className="nav-link">
                👤 {user.name}
              </span>
            </li>

            <li className="nav-item">
              <button
                className="btn btn-outline-secondary btn-sm mr-2"
                onClick={() => (window.location.href = "/profile")}
              >
                My Profile
              </button>
            </li>

            <li className="nav-item">
              <button
                className="btn btn-danger btn-sm"
                onClick={logout}
              >
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
