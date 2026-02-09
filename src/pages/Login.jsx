// pages/Login.jsx - Full Screen Center Design
import React, { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  LogIn, 
  Shield,
  Calendar,
  Smartphone,
  ArrowLeft,
  Key,
  CheckCircle,
  XCircle
} from "lucide-react";

const Login = ({ onLogin, systemSettings }) => {
  const [formType, setFormType] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    resetCode: "",
    newPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get users from localStorage
  const getUsers = () => {
    return JSON.parse(localStorage.getItem("users") || "[]");
  };

  const saveUsers = (users) => {
    localStorage.setItem("users", JSON.stringify(users));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    setTimeout(() => {
      try {
        if (formType === "login") {
          // Login logic
          const users = getUsers();
          const user = users.find(u => 
            u.email === formData.email && u.password === formData.password
          );

          if (!user) {
            setError("Invalid email or password");
            setLoading(false);
            return;
          }

          // Generate token
          const token = btoa(`${user.email}:${Date.now()}`);
          
          onLogin({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            role: user.role || "admin",
            avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=667eea&color=fff`,
            joinDate: user.joinDate || new Date().toISOString()
          }, token);

        } else if (formType === "signup") {
          // Signup logic
          if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
          }

          if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
          }

          const users = getUsers();
          const userExists = users.some(u => u.email === formData.email);

          if (userExists) {
            setError("User already exists with this email");
            setLoading(false);
            return;
          }

          const newUser = {
            id: Date.now(),
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: "admin",
            avatar: `https://ui-avatars.com/api/?name=${formData.name}&background=667eea&color=fff`,
            joinDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };

          saveUsers([...users, newUser]);
          
          // Generate token
          const token = btoa(`${newUser.email}:${Date.now()}`);
          
          setSuccess("Account created successfully! Redirecting...");
          
          setTimeout(() => {
            onLogin({
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              phone: newUser.phone,
              role: newUser.role,
              avatar: newUser.avatar,
              joinDate: newUser.joinDate
            }, token);
          }, 1500);

        } else if (formType === "forgot") {
          // Forgot password logic
          const users = getUsers();
          const user = users.find(u => u.email === formData.email);

          if (!user) {
            setError("No account found with this email");
            setLoading(false);
            return;
          }

          // In a real app, you would send an email with reset code
          // For demo, we'll generate a simple code
          const resetCode = Math.floor(100000 + Math.random() * 900000);
          
          // Save reset code to user data
          user.resetCode = resetCode;
          user.resetExpires = Date.now() + 3600000; // 1 hour
          saveUsers(users);

          // Simulate sending email
          setSuccess(`Reset code sent to ${formData.email}. Use code: ${resetCode} (Demo Only)`);
          setTimeout(() => {
            setFormType("reset");
            setSuccess("");
            setLoading(false);
          }, 2000);
        } else if (formType === "reset") {
          // Reset password logic
          const users = getUsers();
          const user = users.find(u => u.email === formData.email);

          if (!user || user.resetCode !== parseInt(formData.resetCode)) {
            setError("Invalid reset code");
            setLoading(false);
            return;
          }

          if (Date.now() > user.resetExpires) {
            setError("Reset code has expired");
            setLoading(false);
            return;
          }

          if (formData.newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
          }

          // Update password
          user.password = formData.newPassword;
          delete user.resetCode;
          delete user.resetExpires;
          saveUsers(users);

          setSuccess("Password reset successful! You can now login.");
          setTimeout(() => {
            setFormType("login");
            setSuccess("");
            setLoading(false);
          }, 2000);
        }
      } catch (err) {
        setError("An error occurred. Please try again.");
        console.error(err);
      } finally {
        if (formType !== "forgot") {
          setLoading(false);
        }
      }
    }, 1000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Reset form when switching types
  const switchFormType = (type) => {
    setFormType(type);
    setError("");
    setSuccess("");
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      resetCode: "",
      newPassword: ""
    });
  };

  const getFormTitle = () => {
    switch (formType) {
      case "login": return "Welcome to CodeHub Academy";
      case "signup": return "Create Account";
      case "forgot": return "Reset Password";
      case "reset": return "Enter Reset Code";
      default: return "Welcome";
    }
  };

  const getFormSubtitle = () => {
    switch (formType) {
      case "login": return "Access your student management dashboard";
      case "signup": return "Join CodeHub Academy Management System";
      case "forgot": return "Enter your email to receive reset instructions";
      case "reset": return "Enter the code sent to your email";
      default: return "";
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      position: "fixed",
      top: 0,
      left: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      backgroundImage: "radial-gradient(circle at 10% 20%, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.9) 90%)",
      padding: "20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      zIndex: 1000,
      overflowY: "auto"
    }}>
      {/* Decorative Background Elements */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
        zIndex: 1
      }}></div>
      
      <div style={{
        position: "absolute",
        top: "10%",
        left: "10%",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
        filter: "blur(40px)",
        zIndex: 1
      }}></div>
      
      <div style={{
        position: "absolute",
        bottom: "10%",
        right: "10%",
        width: "200px",
        height: "200px",
        borderRadius: "50%",
        background: "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
        filter: "blur(40px)",
        zIndex: 1
      }}></div>

      {/* Centered Login Form */}
      <div style={{
        width: "100%",
        maxWidth: "460px",
        maxHeight: "90vh",
        background: "rgba(255, 255, 255, 0.98)",
        borderRadius: "28px",
        boxShadow: "0 30px 100px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)",
        overflow: "hidden",
        position: "relative",
        zIndex: 2,
        animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.3)"
      }}>
        {/* Header with gradient */}
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: formType === "forgot" || formType === "reset" ? "30px 30px 20px" : "35px 30px 15px",
          textAlign: "center",
          color: "white",
          position: "relative",
          flexShrink: 0
        }}>
          {/* Back button for forgot/reset */}
          {(formType === "forgot" || formType === "reset") && (
            <button
              onClick={() => switchFormType("login")}
              style={{
                position: "absolute",
                left: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "12px",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                fontSize: "0"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
            >
              <ArrowLeft size={20} />
            </button>
          )}

<div style={{
  width: formType === "forgot" || formType === "reset" ? "70px" : "80px",
  height: formType === "forgot" || formType === "reset" ? "70px" : "80px",
  backgroundImage: "url('/download.png')",
  backgroundSize: "contain",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 18px",
  border: "2px solid white",
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  backgroundColor: "white"
}}>
  {/* Fallback text agar image load na ho */}
  <div style={{
    display: "none",
    color: "#667eea",
    fontSize: "24px",
    fontWeight: "bold"
  }}>
    CH
  </div>
</div>
          
          <h2 style={{ 
            fontSize: formType === "forgot" || formType === "reset" ? "26px" : "28px", 
            fontWeight: "800", 
            marginBottom: "10px",
            letterSpacing: "-0.5px",
            lineHeight: "1.2"
          }}>
            {getFormTitle()}
          </h2>
          
          <p style={{ 
            opacity: 0.95, 
            fontSize: "15px",
            fontWeight: "500",
            marginBottom: "5px"
          }}>
            {getFormSubtitle()}
          </p>
        </div>

        {/* Tabs (only for login/signup) */}
        {(formType === "login" || formType === "signup") && (
          <div style={{
            display: "flex",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            flexShrink: 0,
            padding: "5px 30px 0"
          }}>
            <button
              onClick={() => switchFormType("login")}
              style={{
                flex: 1,
                padding: "18px 5px",
                background: formType === "login" ? "white" : "transparent",
                border: "none",
                fontSize: "15px",
                fontWeight: "700",
                color: formType === "login" ? "#667eea" : "#718096",
                cursor: "pointer",
                borderBottom: formType === "login" ? "4px solid #667eea" : "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                position: "relative",
                marginTop: "5px"
              }}
            >
              <LogIn size={18} />
              Sign In
              {formType === "login" && (
                <div style={{
                  position: "absolute",
                  bottom: "-4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "40px",
                  height: "4px",
                  background: "#667eea",
                  borderRadius: "2px 2px 0 0"
                }}></div>
              )}
            </button>
            <button
              onClick={() => switchFormType("signup")}
              style={{
                flex: 1,
                padding: "18px 5px",
                background: formType === "signup" ? "white" : "transparent",
                border: "none",
                fontSize: "15px",
                fontWeight: "700",
                color: formType === "signup" ? "#667eea" : "#718096",
                cursor: "pointer",
                borderBottom: formType === "signup" ? "4px solid #667eea" : "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                position: "relative",
                marginTop: "5px"
              }}
            >
              <User size={18} />
              Sign Up
              {formType === "signup" && (
                <div style={{
                  position: "absolute",
                  bottom: "-4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "40px",
                  height: "4px",
                  background: "#667eea",
                  borderRadius: "2px 2px 0 0"
                }}></div>
              )}
            </button>
          </div>
        )}

        {/* Scrollable Form Area */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: formType === "forgot" || formType === "reset" ? "25px 30px 20px" : "30px 30px 20px",
          maxHeight: "calc(90vh - 220px)"
        }}>
          <form onSubmit={handleSubmit}>
            {/* Success Message */}
            {success && (
              <div style={{
                background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                color: "#065f46",
                padding: "14px 18px",
                borderRadius: "14px",
                marginBottom: "25px",
                fontSize: "14px",
                border: "1px solid #a7f3d0",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)",
                animation: "fadeIn 0.3s ease"
              }}>
                <CheckCircle size={20} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span style={{ fontWeight: "600", lineHeight: "1.5" }}>{success}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{
                background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                color: "#dc2626",
                padding: "14px 18px",
                borderRadius: "14px",
                marginBottom: "25px",
                fontSize: "14px",
                border: "1px solid #fecaca",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.1)",
                animation: "fadeIn 0.3s ease"
              }}>
                <XCircle size={20} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span style={{ fontWeight: "600", lineHeight: "1.5" }}>{error}</span>
              </div>
            )}

            {/* Name Field (Signup only) */}
            {formType === "signup" && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ position: "relative" }}>
                  <User style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#a0aec0",
                    zIndex: 1,
                    transition: "color 0.3s"
                  }} size={18} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required={formType === "signup"}
                    style={{
                      width: "100%",
                      padding: "16px 16px 16px 48px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "14px",
                      fontSize: "15px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backgroundColor: "white",
                      fontWeight: "500",
                      color: "#2d3748"
                    }}
                  />
                </div>
              </div>
            )}

            {/* Email Field (All forms except reset) */}
            {(formType === "login" || formType === "signup" || formType === "forgot") && (
              <div style={{ marginBottom: formType === "forgot" ? "25px" : "20px" }}>
                <div style={{ position: "relative" }}>
                  <Mail style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#a0aec0",
                    zIndex: 1,
                    transition: "color 0.3s"
                  }} size={18} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "16px 16px 16px 48px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "14px",
                      fontSize: "15px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backgroundColor: "white",
                      fontWeight: "500",
                      color: "#2d3748"
                    }}
                  />
                </div>
              </div>
            )}

            {/* Phone Field (Signup only) */}
            {formType === "signup" && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ position: "relative" }}>
                  <Smartphone style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#a0aec0",
                    zIndex: 1,
                    transition: "color 0.3s"
                  }} size={18} />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "16px 16px 16px 48px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "14px",
                      fontSize: "15px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backgroundColor: "white",
                      fontWeight: "500",
                      color: "#2d3748"
                    }}
                  />
                </div>
              </div>
            )}

            {/* Reset Code Field (Reset only) */}
            {formType === "reset" && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ position: "relative" }}>
                  <Key style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#a0aec0",
                    zIndex: 1,
                    transition: "color 0.3s"
                  }} size={18} />
                  <input
                    type="text"
                    name="resetCode"
                    placeholder="Enter 6-digit reset code"
                    value={formData.resetCode}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "16px 16px 16px 48px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "14px",
                      fontSize: "15px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backgroundColor: "white",
                      fontWeight: "500",
                      color: "#2d3748",
                      letterSpacing: "6px",
                      textAlign: "center"
                    }}
                  />
                </div>
              </div>
            )}

            {/* New Password Field (Reset only) */}
            {formType === "reset" && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ position: "relative" }}>
                  <Lock style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#a0aec0",
                    zIndex: 1,
                    transition: "color 0.3s"
                  }} size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="New Password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "16px 48px 16px 48px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "14px",
                      fontSize: "15px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backgroundColor: "white",
                      fontWeight: "500",
                      color: "#2d3748"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#a0aec0",
                      padding: "5px",
                      transition: "all 0.3s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = "#667eea"}
                    onMouseOut={(e) => e.currentTarget.style.color = "#a0aec0"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Password Field (Login & Signup only) */}
            {(formType === "login" || formType === "signup") && (
              <div style={{ marginBottom: formType === "login" ? "10px" : "20px" }}>
                <div style={{ position: "relative" }}>
                  <Lock style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#a0aec0",
                    zIndex: 1,
                    transition: "color 0.3s"
                  }} size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required={formType === "login" || formType === "signup"}
                    style={{
                      width: "100%",
                      padding: "16px 48px 16px 48px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "14px",
                      fontSize: "15px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backgroundColor: "white",
                      fontWeight: "500",
                      color: "#2d3748"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#a0aec0",
                      padding: "5px",
                      transition: "all 0.3s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = "#667eea"}
                    onMouseOut={(e) => e.currentTarget.style.color = "#a0aec0"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Link (Login only) */}
            {formType === "login" && (
              <div style={{
                textAlign: "right",
                marginBottom: "25px"
              }}>
                <button
                  type="button"
                  onClick={() => switchFormType("forgot")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#667eea",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "5px 0",
                    transition: "all 0.3s",
                    textDecoration: "none"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = "#764ba2";
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = "#667eea";
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Confirm Password Field (Signup only) */}
            {formType === "signup" && (
              <div style={{ marginBottom: "25px" }}>
                <div style={{ position: "relative" }}>
                  <Lock style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#a0aec0",
                    zIndex: 1,
                    transition: "color 0.3s"
                  }} size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={formType === "signup"}
                    style={{
                      width: "100%",
                      padding: "16px 48px 16px 48px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "14px",
                      fontSize: "15px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backgroundColor: "white",
                      fontWeight: "500",
                      color: "#2d3748"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#a0aec0",
                      padding: "5px",
                      transition: "all 0.3s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = "#667eea"}
                    onMouseOut={(e) => e.currentTarget.style.color = "#a0aec0"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "18px",
                background: loading ? "#a0aec0" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "14px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                marginBottom: "25px",
                boxShadow: loading ? "none" : "0 8px 25px rgba(102, 126, 234, 0.4)",
                letterSpacing: "0.5px",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(102, 126, 234, 0.5)";
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.4)";
                }
              }}
            >
              {loading && (
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  animation: "shimmer 1.5s infinite"
                }}></div>
              )}
              {loading ? (
                <>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    border: "3px solid rgba(255,255,255,0.3)",
                    borderTop: "3px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    position: "relative",
                    zIndex: 2
                  }} />
                  <span style={{ position: "relative", zIndex: 2 }}>
                    {formType === "login" ? "Signing In..." : 
                     formType === "signup" ? "Creating Account..." :
                     formType === "forgot" ? "Sending Reset Code..." : "Resetting Password..."}
                  </span>
                </>
              ) : (
                <>
                  {formType === "login" ? <LogIn size={18} style={{ position: "relative", zIndex: 2 }} /> :
                   formType === "signup" ? <User size={18} style={{ position: "relative", zIndex: 2 }} /> :
                   formType === "forgot" ? <Mail size={18} style={{ position: "relative", zIndex: 2 }} /> : 
                   <Key size={18} style={{ position: "relative", zIndex: 2 }} />}
                  <span style={{ position: "relative", zIndex: 2 }}>
                    {formType === "login" ? "Sign In" :
                     formType === "signup" ? "Create Account" :
                     formType === "forgot" ? "Send Reset Code" : "Reset Password"}
                  </span>
                </>
              )}
            </button>

            {/* Switch Form Links */}
            {formType === "forgot" ? (
              <div style={{
                textAlign: "center",
                color: "#718096",
                fontSize: "15px",
                fontWeight: "500"
              }}>
                <button
                  type="button"
                  onClick={() => switchFormType("login")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#667eea",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "14px",
                    padding: "8px 16px",
                    transition: "all 0.3s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = "#764ba2";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = "#667eea";
                  }}
                >
                  ← Back to Sign In
                </button>
              </div>
            ) : (formType === "login" || formType === "signup") && (
              <div style={{
                textAlign: "center",
                color: "#718096",
                fontSize: "15px",
                fontWeight: "500",
                paddingTop: "10px",
                borderTop: "1px solid #e2e8f0"
              }}>
                <p style={{ marginBottom: "15px" }}>
                  {formType === "login" ? "Don't have an account?" : "Already have an account?"}
                </p>
                <button
                  type="button"
                  onClick={() => switchFormType(formType === "login" ? "signup" : "login")}
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "14px",
                    padding: "12px 24px",
                    borderRadius: "10px",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
                  }}
                >
                  {formType === "login" ? "Create New Account" : "Sign In to Existing Account"}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div style={{
          background: "#f8fafc",
          padding: "18px 30px",
          textAlign: "center",
          borderTop: "1px solid #e2e8f0",
          fontSize: "13px",
          color: "#a0aec0",
          fontWeight: "500",
          flexShrink: 0
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "15px", 
            marginBottom: "10px",
            opacity: 0.7
          }}>
            <Shield size={14} />
            <Calendar size={14} />
            <Smartphone size={14} />
          </div>
          <p style={{ marginBottom: "5px" }}>© 2024 CodeHub Academy. All rights reserved.</p>
          <p style={{ fontSize: "12px", opacity: 0.8 }}>Student Management System v2.0</p>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(40px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          input:focus {
            outline: none;
            border-color: #667eea !important;
            background-color: white !important;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
          }
          
          input:focus + svg {
            color: #667eea !important;
          }
          
          /* Custom Scrollbar */
          div[style*="overflow-y: auto"]::-webkit-scrollbar {
            width: 6px;
          }
          
          div[style*="overflow-y: auto"]::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          
          div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 10px;
          }
          
          div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb:hover {
            background: #a1a1a1;
          }
          
          /* Responsive Design */
          @media (max-width: 640px) {
            .login-form {
              max-width: 95% !important;
              border-radius: 24px !important;
              max-height: 95vh !important;
            }
            
            .login-header {
              padding: 25px 20px 15px !important;
            }
            
            .form-container {
              padding: 20px 20px 15px !important;
              max-height: calc(95vh - 200px) !important;
            }
            
            input {
              padding: 14px 14px 14px 44px !important;
              font-size: 14px !important;
            }
            
            .footer {
              padding: 15px 20px !important;
            }
          }
          
          @media (max-width: 480px) {
            .login-form {
              max-width: 100% !important;
              border-radius: 0 !important;
              min-height: 100vh !important;
              max-height: 100vh !important;
            }
            
            .login-container {
              padding: 0 !important;
            }
            
            .form-container {
              max-height: calc(100vh - 200px) !important;
            }
            
            h2 {
              font-size: 24px !important;
            }
            
            p {
              font-size: 14px !important;
            }
          }
          
          @media (max-height: 700px) {
            .form-container {
              max-height: 50vh !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;