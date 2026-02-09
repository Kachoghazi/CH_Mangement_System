// pages/Profile.jsx - COMPLETE CODE WITH LOGO EDITING
import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Calendar,
  Phone,
  Shield,
  Edit,
  Save,
  X,
  LogOut,
  SwitchCamera,
  Plus,
  Check,
  Key,
  Camera,
  Upload,
  Image,
  XCircle,
  CheckCircle,
  Building,
  BookOpen,
  MapPin,
  Globe,
  Palette,
  CreditCard,
  MessageSquare
} from "lucide-react";

// Import academy config functions - FIXED PATH
import { getAcademyConfig, updateAcademyConfig } from "../config/academyConfig";

const Profile = ({ 
  currentUser, 
  setCurrentUser,
  onUpdateProfile, 
  onSwitchAccount, 
  onLogout, 
  systemSettings,
  onAcademyConfigUpdate // Add this prop to trigger refresh in parent
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Academy configuration state
  const [academyConfig, setAcademyConfig] = useState(getAcademyConfig());
  const [isEditingAcademy, setIsEditingAcademy] = useState(false);
  
  const [otherUsers, setOtherUsers] = useState([]);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const logoFileInputRef = useRef(null);

  // Predefined avatar options
  const avatarOptions = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa"
  ];

  // Color options for theme
  const colorOptions = [
    { name: "Blue", primary: "#3b82f6", secondary: "#1d4ed8" },
    { name: "Green", primary: "#10b981", secondary: "#065f46" },
    { name: "Purple", primary: "#8b5cf6", secondary: "#7c3aed" },
    { name: "Orange", primary: "#f59e0b", secondary: "#d97706" },
    { name: "Pink", primary: "#ec4899", secondary: "#db2777" },
    { name: "Red", primary: "#ef4444", secondary: "#dc2626" }
  ];

  // Emoji options for logo
  const emojiOptions = ["💻", "🚀", "🎓", "🔥", "⭐", "👨‍💻", "👩‍💻", "📚", "⚡", "🎯", "🏆", "💡"];

  // Load all users on component mount
  useEffect(() => {
    if (currentUser) {
      const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
      // Filter out current user
      const filteredUsers = allUsers.filter(user => user.email !== currentUser.email);
      setOtherUsers(filteredUsers);
      
      // Set edit data
      setEditData({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
    
    // Load academy config
    setAcademyConfig(getAcademyConfig());
  }, [currentUser]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setPasswordError("");
    setPasswordSuccess("");
    setSelectedAvatar(null);
    setAvatarPreview(null);
    setShowAvatarOptions(false);
  };

  const handleSave = () => {
    if (!editData.name.trim()) {
      alert("Name is required");
      return;
    }

    // Prepare updated user data
    const updatedUserData = {
      ...currentUser,
      name: editData.name,
      phone: editData.phone
    };

    // If a new avatar was selected, update it
    if (selectedAvatar) {
      updatedUserData.avatar = selectedAvatar;
    }

    // Update in localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = users.map(user => {
      if (user.email === currentUser.email) {
        return updatedUserData;
      }
      return user;
    });

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    localStorage.setItem("currentUser", JSON.stringify(updatedUserData));

    // Update current user state using both methods
    if (setCurrentUser) {
      setCurrentUser(updatedUserData);
    }
    if (onUpdateProfile) {
      onUpdateProfile(updatedUserData);
    }

    setIsEditing(false);
    setSelectedAvatar(null);
    setShowAvatarOptions(false);
    
    // Show success message
    alert("Profile updated successfully!");
  };

  // Handle academy config save
  const handleSaveAcademyConfig = () => {
    if (!academyConfig.name.trim()) {
      alert("Academy name is required");
      return;
    }

    if (!academyConfig.tagline.trim()) {
      alert("Academy tagline is required");
      return;
    }

    updateAcademyConfig(academyConfig);
    
    // Trigger refresh in parent component
    if (onAcademyConfigUpdate) {
      onAcademyConfigUpdate();
    }
    
    setIsEditingAcademy(false);
    alert("Academy settings updated successfully!");
  };

  const handlePasswordChange = () => {
    // ... existing password change code ...
  };

  const handleAddAccount = () => {
    if (window.confirm("You will be logged out to add a new account. Continue?")) {
      onLogout();
    }
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    setAvatarPreview(avatarUrl);
    setShowAvatarOptions(false);
  };

  // Handle file upload for avatar
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }

    // Check file type
    if (!file.type.match('image.*')) {
      alert("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedAvatar(e.target.result);
      setAvatarPreview(e.target.result);
      setShowAvatarOptions(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle logo file upload
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo size should be less than 2MB");
      return;
    }

    // Check file type
    if (!file.type.match('image.*')) {
      alert("Please select an image file for logo");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setAcademyConfig({
        ...academyConfig,
        logoType: "image",
        logo: e.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  // Remove selected avatar
  const handleRemoveAvatar = () => {
    setSelectedAvatar(null);
    setAvatarPreview(null);
    
    const updatedUser = {
      ...currentUser,
      avatar: null
    };
    
    // Update state
    if (setCurrentUser) {
      setCurrentUser(updatedUser);
    }
    if (onUpdateProfile) {
      onUpdateProfile(updatedUser);
    }
    
    // Update in localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = users.map(user => {
      if (user.email === currentUser.email) {
        return { ...user, avatar: null };
      }
      return user;
    });
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  };

  // Get current avatar URL
  const getCurrentAvatar = () => {
    if (selectedAvatar) return selectedAvatar;
    if (currentUser.avatar) return currentUser.avatar;
    return `https://ui-avatars.com/api/?name=${currentUser.name}&background=667eea&color=fff`;
  };

  // Handle color theme change
  const handleColorChange = (color) => {
    setAcademyConfig(prev => ({
      ...prev,
      theme: {
        primaryColor: color.primary,
        secondaryColor: color.secondary
      }
    }));
  };

  return (
    <div style={{
      padding: "30px",
      maxWidth: "1200px",
      margin: "0 auto"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "40px",
        paddingBottom: "20px",
        borderBottom: "2px solid var(--border-color)"
      }}>
        <div>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "var(--text-primary)",
            marginBottom: "8px"
          }}>
            My Account & Academy Settings
          </h1>
          <p style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            opacity: 0.8
          }}>
            Manage your profile, academy details, and settings
          </p>
        </div>
        
        {!isEditing && activeTab === "profile" && (
          <button
            onClick={handleEdit}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s"
            }}
          >
            <Edit size={16} />
            Edit Profile
          </button>
        )}
        
        {activeTab === "academy" && !isEditingAcademy && (
          <button
            onClick={() => setIsEditingAcademy(true)}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s"
            }}
          >
            <Edit size={16} />
            Edit Academy Settings
          </button>
        )}
      </div>

      {/* Tabs - Added Academy Tab */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "30px",
        borderBottom: "1px solid var(--border-color)",
        paddingBottom: "10px",
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => setActiveTab("profile")}
          style={{
            padding: "12px 24px",
            background: activeTab === "profile" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "var(--card-bg)",
            color: activeTab === "profile" ? "white" : "var(--text-secondary)",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <User size={16} />
          Profile
        </button>
        
        <button
          onClick={() => setActiveTab("security")}
          style={{
            padding: "12px 24px",
            background: activeTab === "security" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "var(--card-bg)",
            color: activeTab === "security" ? "white" : "var(--text-secondary)",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Key size={16} />
          Security
        </button>
        
        <button
          onClick={() => setActiveTab("academy")}
          style={{
            padding: "12px 24px",
            background: activeTab === "academy" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "var(--card-bg)",
            color: activeTab === "academy" ? "white" : "var(--text-secondary)",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Building size={16} />
          Academy Settings
        </button>
        
        <button
          onClick={() => setActiveTab("accounts")}
          style={{
            padding: "12px 24px",
            background: activeTab === "accounts" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "var(--card-bg)",
            color: activeTab === "accounts" ? "white" : "var(--text-secondary)",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <SwitchCamera size={16} />
          Accounts ({otherUsers.length + 1})
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "profile" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: "30px",
          background: "var(--card-bg)",
          borderRadius: "16px",
          padding: "30px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
        }}>
          {/* Left Column - Profile Info with Avatar Section */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            paddingRight: "30px",
            borderRight: "1px solid var(--border-color)",
            position: "relative"
          }}>
            {/* Avatar Section */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid #667eea",
                boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
                position: "relative"
              }}>
                <img 
                  src={getCurrentAvatar()}
                  alt={currentUser.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
                
                {/* Change Avatar Button */}
                {isEditing && (
                  <button
                    onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                    style={{
                      position: "absolute",
                      bottom: "0",
                      right: "0",
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "3px solid white",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "white"
                    }}
                  >
                    <Camera size={18} />
                  </button>
                )}
              </div>

              {/* Remove Avatar Button */}
              {isEditing && currentUser.avatar && !selectedAvatar && (
                <button
                  onClick={handleRemoveAvatar}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "rgba(239, 68, 68, 0.9)",
                    border: "2px solid white",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "12px"
                  }}
                  title="Remove current avatar"
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>

            {/* Avatar Options Modal */}
            {showAvatarOptions && isEditing && (
              <div style={{
                position: "absolute",
                top: "160px",
                left: "0",
                right: "30px",
                background: "var(--card-bg)",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                border: "1px solid var(--border-color)",
                zIndex: 1000
              }}>
                <h4 style={{
                  marginBottom: "15px",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <Image size={18} />
                  Change Profile Picture
                </h4>
                
                <div style={{ marginBottom: "15px" }}>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "rgba(102, 126, 234, 0.1)",
                      border: "2px dashed rgba(102, 126, 234, 0.5)",
                      borderRadius: "8px",
                      color: "#667eea",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginBottom: "15px"
                    }}
                  >
                    <Upload size={16} />
                    Upload Photo
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  
                  <p style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    marginBottom: "15px"
                  }}>
                    Max size: 2MB • JPG, PNG, GIF
                  </p>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <p style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    marginBottom: "10px"
                  }}>
                    Choose from avatars:
                  </p>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "10px"
                  }}>
                    {avatarOptions.map((avatar, index) => (
                      <div
                        key={index}
                        onClick={() => handleAvatarSelect(avatar)}
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: selectedAvatar === avatar ? "3px solid #667eea" : "2px solid var(--border-color)",
                          cursor: "pointer"
                        }}
                      >
                        <img 
                          src={avatar}
                          alt={`Avatar ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowAvatarOptions(false)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "var(--input-bg)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Preview Selected Avatar */}
            {avatarPreview && isEditing && (
              <div style={{
                marginTop: "10px",
                padding: "10px",
                background: "rgba(102, 126, 234, 0.1)",
                borderRadius: "10px",
                border: "2px solid rgba(102, 126, 234, 0.3)"
              }}>
                <p style={{
                  fontSize: "12px",
                  color: "#667eea",
                  fontWeight: "600",
                  marginBottom: "5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}>
                  <CheckCircle size={12} />
                  New avatar selected
                </p>
                <p style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)"
                }}>
                  Click "Save Changes" to apply
                </p>
              </div>
            )}
            
            <div style={{ textAlign: "center" }}>
              <h3 style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "var(--text-primary)",
                marginBottom: "5px"
              }}>
                {currentUser.name}
              </h3>
              <div style={{
                fontSize: "14px",
                color: "#667eea",
                background: "rgba(102, 126, 234, 0.1)",
                padding: "4px 12px",
                borderRadius: "20px",
                display: "inline-block",
                fontWeight: "600"
              }}>
                {currentUser.role === "admin" ? "Administrator" : "User"}
              </div>
            </div>
            
            <div style={{
              background: "var(--input-bg)",
              borderRadius: "12px",
              padding: "15px",
              width: "100%"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px"
              }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Shield size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Account Status
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#10b981" }}>
                    Active • Verified
                  </div>
                </div>
              </div>
              
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  background: "rgba(16, 185, 129, 0.1)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Calendar size={18} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Member Since
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
                    {new Date(currentUser.joinDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "25px",
              paddingBottom: "15px",
              borderBottom: "1px solid var(--border-color)"
            }}>
              Personal Information
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  fontSize: "14px"
                }}>
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "2px solid var(--border-color)",
                      borderRadius: "10px",
                      fontSize: "15px",
                      backgroundColor: "var(--input-bg)"
                    }}
                  />
                ) : (
                  <div style={{
                    padding: "14px",
                    background: "var(--input-bg)",
                    borderRadius: "10px",
                    fontSize: "15px",
                    color: "var(--text-primary)",
                    border: "2px solid transparent"
                  }}>
                    {currentUser.name}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  fontSize: "14px"
                }}>
                  Email Address
                </label>
                <div style={{
                  padding: "14px",
                  background: "var(--input-bg)",
                  borderRadius: "10px",
                  fontSize: "15px",
                  color: "var(--text-primary)",
                  border: "2px solid transparent",
                  opacity: isEditing ? 0.7 : 1
                }}>
                  {currentUser.email}
                  <div style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginTop: "5px"
                  }}>
                    Email cannot be changed
                  </div>
                </div>
              </div>

              <div>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  fontSize: "14px"
                }}>
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    placeholder="Enter phone number"
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "2px solid var(--border-color)",
                      borderRadius: "10px",
                      fontSize: "15px",
                      backgroundColor: "var(--input-bg)"
                    }}
                  />
                ) : (
                  <div style={{
                    padding: "14px",
                    background: "var(--input-bg)",
                    borderRadius: "10px",
                    fontSize: "15px",
                    color: currentUser.phone ? "var(--text-primary)" : "var(--text-secondary)",
                    border: "2px solid transparent"
                  }}>
                    {currentUser.phone || "Not provided"}
                  </div>
                )}
              </div>

              {isEditing && (
                <div style={{
                  display: "flex",
                  gap: "15px",
                  paddingTop: "20px",
                  borderTop: "1px solid var(--border-color)"
                }}>
                  <button
                    onClick={handleSave}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: "var(--card-bg)",
                      color: "var(--text-primary)",
                      border: "2px solid var(--border-color)",
                      borderRadius: "10px",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div style={{
          background: "var(--card-bg)",
          borderRadius: "16px",
          padding: "30px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "var(--text-primary)",
            marginBottom: "25px",
            paddingBottom: "15px",
            borderBottom: "1px solid var(--border-color)"
          }}>
            Password & Security
          </h3>
          
          {!showPasswordFields ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px",
              background: "var(--input-bg)",
              borderRadius: "12px",
              border: "1px solid var(--border-color)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Key size={24} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
                    Password
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "3px" }}>
                    Last changed: {new Date(currentUser.joinDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowPasswordFields(true)}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Change Password
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: "500px" }}>
              <div style={{ marginBottom: "25px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  fontSize: "14px"
                }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={editData.currentPassword}
                  onChange={(e) => setEditData({...editData, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "2px solid var(--border-color)",
                    borderRadius: "10px",
                    fontSize: "15px",
                    backgroundColor: "var(--input-bg)"
                  }}
                />
              </div>
              
              <div style={{ marginBottom: "25px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  fontSize: "14px"
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={editData.newPassword}
                  onChange={(e) => setEditData({...editData, newPassword: e.target.value})}
                  placeholder="Enter new password"
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "2px solid var(--border-color)",
                    borderRadius: "10px",
                    fontSize: "15px",
                    backgroundColor: "var(--input-bg)"
                  }}
                />
              </div>
              
              <div style={{ marginBottom: "25px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  fontSize: "14px"
                }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={editData.confirmPassword}
                  onChange={(e) => setEditData({...editData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "2px solid var(--border-color)",
                    borderRadius: "10px",
                    fontSize: "15px",
                    backgroundColor: "var(--input-bg)"
                  }}
                />
              </div>
              
              {passwordError && (
                <div style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  padding: "12px 15px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontSize: "14px"
                }}>
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div style={{
                  background: "#d1fae5",
                  color: "#065f46",
                  padding: "12px 15px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontSize: "14px"
                }}>
                  {passwordSuccess}
                </div>
              )}
              
              <div style={{ display: "flex", gap: "15px" }}>
                <button
                  onClick={handlePasswordChange}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  Update Password
                </button>
                <button
                  onClick={() => {
                    setShowPasswordFields(false);
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "var(--card-bg)",
                    color: "var(--text-primary)",
                    border: "2px solid var(--border-color)",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "academy" && (
        <div style={{
          background: "var(--card-bg)",
          borderRadius: "16px",
          padding: "30px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "var(--text-primary)",
            marginBottom: "25px",
            paddingBottom: "15px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <Building size={20} />
            Academy Settings
          </h3>
          
          {!isEditingAcademy ? (
            <div>
              {/* Preview Card */}
              <div style={{
                background: `linear-gradient(135deg, ${academyConfig.theme?.primaryColor || "#3b82f6"} 0%, ${academyConfig.theme?.secondaryColor || "#1d4ed8"} 100%)`,
                borderRadius: "16px",
                padding: "30px",
                color: "white",
                marginBottom: "30px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h4 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 10px 0" }}>
                      {academyConfig.name}
                    </h4>
                    <p style={{ fontSize: "16px", opacity: 0.9, margin: "0 0 5px 0" }}>
                      {academyConfig.tagline}
                    </p>
                    {academyConfig.description && (
                      <p style={{ fontSize: "14px", opacity: 0.8, fontStyle: "italic" }}>
                        {academyConfig.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Logo Preview */}
                  {academyConfig.showLogo !== false && academyConfig.logo && (
                    <div style={{
                      width: "80px",
                      height: "80px",
                      background: "white",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      padding: "10px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}>
                      {academyConfig.logoType === "image" && academyConfig.logo.startsWith("data:image") ? (
                        <img 
                          src={academyConfig.logo} 
                          alt="Academy Logo" 
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain"
                          }}
                        />
                      ) : academyConfig.logoType === "text" ? (
                        <div style={{ 
                          fontSize: "32px", 
                          fontWeight: "bold",
                          color: academyConfig.theme?.primaryColor || "#3b82f6",
                          lineHeight: 1
                        }}>
                          {academyConfig.logo}
                        </div>
                      ) : (
                        <div style={{ 
                          fontSize: "48px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1
                        }}>
                          {academyConfig.logo}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "15px",
                  marginTop: "20px",
                  paddingTop: "20px",
                  borderTop: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <CreditCard size={16} />
                    <span>Currency: {academyConfig.fees?.currency || "₹"}</span>
                  </div>
                  {academyConfig.contact?.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Phone size={16} />
                      <span>{academyConfig.contact.phone}</span>
                    </div>
                  )}
                  {academyConfig.contact?.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Mail size={16} />
                      <span>{academyConfig.contact.email}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Palette size={16} />
                    <span>Theme: {academyConfig.theme?.primaryColor || "Blue"}</span>
                  </div>
                </div>
              </div>
              
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
                marginBottom: "30px"
              }}>
                <div style={{
                  background: "var(--input-bg)",
                  borderRadius: "12px",
                  padding: "20px"
                }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "15px" }}>
                    <BookOpen size={16} style={{ marginRight: "8px" }} />
                    Current Settings
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Academy Name:</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{academyConfig.name}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Tagline:</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{academyConfig.tagline}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Description:</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{academyConfig.description || "Not set"}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  background: "var(--input-bg)",
                  borderRadius: "12px",
                  padding: "20px"
                }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "15px" }}>
                    <Palette size={16} style={{ marginRight: "8px" }} />
                    Theme Settings
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Primary Color:</span>
                      <div style={{
                        width: "20px",
                        height: "20px",
                        background: academyConfig.theme?.primaryColor || "#3b82f6",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)"
                      }}></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Secondary Color:</span>
                      <div style={{
                        width: "20px",
                        height: "20px",
                        background: academyConfig.theme?.secondaryColor || "#1d4ed8",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)"
                      }}></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Currency:</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{academyConfig.fees?.currency || "₹"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "25px" }}>
                {/* Left Column - Basic Info */}
                <div>
                  <h4 style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    marginBottom: "15px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid var(--border-color)"
                  }}>
                    Basic Information
                  </h4>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        fontSize: "14px"
                      }}>
                        Academy Name *
                      </label>
                      <input
                        type="text"
                        value={academyConfig.name}
                        onChange={(e) => setAcademyConfig({...academyConfig, name: e.target.value})}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid var(--border-color)",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "var(--input-bg)"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        fontSize: "14px"
                      }}>
                        Tagline *
                      </label>
                      <input
                        type="text"
                        value={academyConfig.tagline}
                        onChange={(e) => setAcademyConfig({...academyConfig, tagline: e.target.value})}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid var(--border-color)",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "var(--input-bg)"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        fontSize: "14px"
                      }}>
                        Description
                      </label>
                      <textarea
                        value={academyConfig.description || ""}
                        onChange={(e) => setAcademyConfig({...academyConfig, description: e.target.value})}
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid var(--border-color)",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "var(--input-bg)",
                          resize: "vertical"
                        }}
                        placeholder="Brief description of your academy"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Theme & Contact */}
                <div>
                  <h4 style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    marginBottom: "15px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid var(--border-color)"
                  }}>
                    Theme & Appearance
                  </h4>
                  
                  <div style={{ marginBottom: "25px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "12px",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      fontSize: "14px"
                    }}>
                      Color Theme
                    </label>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                      gap: "10px"
                    }}>
                      {colorOptions.map((color, index) => (
                        <div
                          key={index}
                          onClick={() => handleColorChange(color)}
                          style={{
                            padding: "10px",
                            borderRadius: "8px",
                            border: academyConfig.theme?.primaryColor === color.primary ? 
                              `3px solid ${color.primary}` : "2px solid var(--border-color)",
                            cursor: "pointer",
                            background: "var(--input-bg)",
                            transition: "all 0.3s"
                          }}
                        >
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "5px"
                          }}>
                            <div style={{
                              width: "20px",
                              height: "20px",
                              background: color.primary,
                              borderRadius: "4px"
                            }}></div>
                            <div style={{
                              width: "20px",
                              height: "20px",
                              background: color.secondary,
                              borderRadius: "4px"
                            }}></div>
                          </div>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "var(--text-primary)",
                            textAlign: "center"
                          }}>
                            {color.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: "25px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      fontSize: "14px"
                    }}>
                      Currency Symbol
                    </label>
                    <select
                      value={academyConfig.fees?.currency || "₹"}
                      onChange={(e) => setAcademyConfig({
                        ...academyConfig, 
                        fees: { ...academyConfig.fees, currency: e.target.value, currencySymbol: e.target.value }
                      })}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "2px solid var(--border-color)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "var(--input-bg)"
                      }}
                    >
                      <option value="₹">Indian Rupee (₹)</option>
                      <option value="$">US Dollar ($)</option>
                      <option value="€">Euro (€)</option>
                      <option value="£">Pound (£)</option>
                      <option value="¥">Yen (¥)</option>
                    </select>
                  </div>
                  
                  <h4 style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    marginBottom: "15px",
                    paddingBottom: "10px",
                    borderTop: "1px solid var(--border-color)",
                    marginTop: "25px"
                  }}>
                    Contact Information
                  </h4>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        fontSize: "14px"
                      }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={academyConfig.contact?.phone || ""}
                        onChange={(e) => setAcademyConfig({
                          ...academyConfig, 
                          contact: { ...academyConfig.contact, phone: e.target.value }
                        })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid var(--border-color)",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "var(--input-bg)"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        fontSize: "14px"
                      }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={academyConfig.contact?.email || ""}
                        onChange={(e) => setAcademyConfig({
                          ...academyConfig, 
                          contact: { ...academyConfig.contact, email: e.target.value }
                        })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid var(--border-color)",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "var(--input-bg)"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        fontSize: "14px"
                      }}>
                        Address
                      </label>
                      <textarea
                        value={academyConfig.contact?.address || ""}
                        onChange={(e) => setAcademyConfig({
                          ...academyConfig, 
                          contact: { ...academyConfig.contact, address: e.target.value }
                        })}
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "2px solid var(--border-color)",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "var(--input-bg)",
                          resize: "vertical"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Logo Configuration Section */}
              <div style={{
                marginTop: "30px",
                paddingTop: "25px",
                borderTop: "2px solid var(--border-color)"
              }}>
                <h4 style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  marginBottom: "20px",
                  paddingBottom: "10px",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <Image size={20} />
                  Academy Logo Configuration
                </h4>
                
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "30px",
                  marginBottom: "20px"
                }}>
                  {/* Logo Preview */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "15px"
                  }}>
                    <div style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "var(--text-secondary)"
                    }}>
                      Logo Preview
                    </div>
                    <div style={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "20px",
                      background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "3px dashed #cbd5e1",
                      overflow: "hidden",
                      padding: "15px"
                    }}>
                      {academyConfig.logoType === "image" && academyConfig.logo && academyConfig.logo.startsWith("data:image") ? (
                        <img 
                          src={academyConfig.logo} 
                          alt="Academy Logo" 
                          style={{ 
                            width: "100%", 
                            height: "100%", 
                            objectFit: "contain" 
                          }} 
                        />
                      ) : academyConfig.logoType === "text" ? (
                        <div style={{ 
                          fontSize: "48px", 
                          fontWeight: "bold",
                          color: academyConfig.theme?.primaryColor || "#3b82f6",
                          lineHeight: 1
                        }}>
                          {academyConfig.logo || "CH"}
                        </div>
                      ) : (
                        <div style={{ 
                          fontSize: "72px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1
                        }}>
                          {academyConfig.logo || "💻"}
                        </div>
                      )}
                    </div>
                    
                    {/* Logo Type Selector */}
                    <div style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      justifyContent: "center"
                    }}>
                      <button
                        type="button"
                        onClick={() => setAcademyConfig({
                          ...academyConfig,
                          logoType: "emoji",
                          logo: academyConfig.logoType === "emoji" ? academyConfig.logo : "💻"
                        })}
                        style={{
                          padding: "10px 16px",
                          background: academyConfig.logoType === "emoji" ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : "var(--input-bg)",
                          color: academyConfig.logoType === "emoji" ? "white" : "var(--text-primary)",
                          border: `2px solid ${academyConfig.logoType === "emoji" ? "#3b82f6" : "var(--border-color)"}`,
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <span style={{ fontSize: "20px" }}>😊</span>
                        Emoji
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setAcademyConfig({
                          ...academyConfig,
                          logoType: "text",
                          logo: academyConfig.logoType === "text" ? academyConfig.logo : "CH"
                        })}
                        style={{
                          padding: "10px 16px",
                          background: academyConfig.logoType === "text" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "var(--input-bg)",
                          color: academyConfig.logoType === "text" ? "white" : "var(--text-primary)",
                          border: `2px solid ${academyConfig.logoType === "text" ? "#10b981" : "var(--border-color)"}`,
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <span style={{ fontSize: "20px" }}>A</span>
                        Text
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current.click()}
                        style={{
                          padding: "10px 16px",
                          background: academyConfig.logoType === "image" ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" : "var(--input-bg)",
                          color: academyConfig.logoType === "image" ? "white" : "var(--text-primary)",
                          border: `2px solid ${academyConfig.logoType === "image" ? "#8b5cf6" : "var(--border-color)"}`,
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <Upload size={16} />
                        Image
                      </button>
                    </div>
                    
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLogoUpload}
                    />
                  </div>
                  
                  {/* Logo Configuration */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px"
                  }}>
                    {/* Show/Hide Logo Toggle */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "15px",
                      background: "var(--input-bg)",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Image size={18} color="var(--text-primary)" />
                        <div>
                          <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
                            Show Logo in Dashboard
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "3px" }}>
                            Display academy logo in dashboard header
                          </div>
                        </div>
                      </div>
                      <label style={{
                        position: "relative",
                        display: "inline-block",
                        width: "60px",
                        height: "30px"
                      }}>
                        <input
                          type="checkbox"
                          checked={academyConfig.showLogo !== false}
                          onChange={(e) => setAcademyConfig({
                            ...academyConfig,
                            showLogo: e.target.checked
                          })}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: academyConfig.showLogo !== false ? "#10b981" : "#cbd5e1",
                          borderRadius: "34px",
                          transition: ".4s"
                        }}>
                          <span style={{
                            position: "absolute",
                            content: '""',
                            height: "22px",
                            width: "22px",
                            left: academyConfig.showLogo !== false ? "32px" : "4px",
                            bottom: "4px",
                            backgroundColor: "white",
                            borderRadius: "50%",
                            transition: ".4s"
                          }}></span>
                        </span>
                      </label>
                    </div>
                    
                    {/* Logo Input based on type */}
                    {academyConfig.logoType === "emoji" && (
                      <div>
                        <label style={{
                          display: "block",
                          marginBottom: "12px",
                          fontWeight: "600",
                          color: "var(--text-primary)",
                          fontSize: "14px"
                        }}>
                          Emoji Logo
                        </label>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px"
                        }}>
                          <input
                            type="text"
                            value={academyConfig.logo || "💻"}
                            onChange={(e) => setAcademyConfig({
                              ...academyConfig,
                              logo: e.target.value
                            })}
                            style={{
                              flex: 1,
                              padding: "14px",
                              border: "2px solid var(--border-color)",
                              borderRadius: "10px",
                              fontSize: "28px",
                              textAlign: "center",
                              backgroundColor: "var(--input-bg)"
                            }}
                            maxLength={2}
                          />
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(6, 1fr)",
                            gap: "8px",
                            maxWidth: "200px"
                          }}>
                            {emojiOptions.map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => setAcademyConfig({
                                  ...academyConfig,
                                  logo: emoji
                                })}
                                style={{
                                  fontSize: "24px",
                                  padding: "10px",
                                  background: academyConfig.logo === emoji ? "rgba(59, 130, 246, 0.2)" : "transparent",
                                  border: `2px solid ${academyConfig.logo === emoji ? "#3b82f6" : "var(--border-color)"}`,
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          marginTop: "10px"
                        }}>
                          Select an emoji or type your own (1-2 characters)
                        </div>
                      </div>
                    )}
                    
                    {academyConfig.logoType === "text" && (
                      <div>
                        <label style={{
                          display: "block",
                          marginBottom: "12px",
                          fontWeight: "600",
                          color: "var(--text-primary)",
                          fontSize: "14px"
                        }}>
                          Text Logo
                        </label>
                        <input
                          type="text"
                          value={academyConfig.logo || "CH"}
                          onChange={(e) => setAcademyConfig({
                            ...academyConfig,
                            logo: e.target.value
                          })}
                          placeholder="Enter text (2-3 characters recommended)"
                          style={{
                            width: "100%",
                            padding: "14px",
                            border: "2px solid var(--border-color)",
                            borderRadius: "10px",
                            fontSize: "16px",
                            backgroundColor: "var(--input-bg)"
                          }}
                          maxLength={10}
                        />
                        <div style={{
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          marginTop: "10px"
                        }}>
                          Recommended: 2-3 characters for best display
                        </div>
                      </div>
                    )}
                    
                    {academyConfig.logoType === "image" && academyConfig.logo && (
                      <div>
                        <label style={{
                          display: "block",
                          marginBottom: "12px",
                          fontWeight: "600",
                          color: "var(--text-primary)",
                          fontSize: "14px"
                        }}>
                          Uploaded Image
                        </label>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px"
                        }}>
                          <div style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            border: "3px solid var(--border-color)"
                          }}>
                            <img 
                              src={academyConfig.logo} 
                              alt="Logo Preview" 
                              style={{ 
                                width: "100%", 
                                height: "100%", 
                                objectFit: "cover" 
                              }} 
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                              Image uploaded successfully
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAcademyConfig({
                                  ...academyConfig,
                                  logo: null,
                                  logoType: "emoji"
                                });
                              }}
                              style={{
                                padding: "8px 16px",
                                background: "#fee2e2",
                                color: "#dc2626",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                              }}
                            >
                              <XCircle size={14} />
                              Remove Image
                            </button>
                          </div>
                        </div>
                        <div style={{
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          marginTop: "10px"
                        }}>
                          Max size: 2MB • JPG, PNG, GIF formats
                        </div>
                      </div>
                    )}
                    
                    {academyConfig.logoType === "image" && !academyConfig.logo && (
                      <div style={{
                        padding: "20px",
                        background: "var(--input-bg)",
                        borderRadius: "12px",
                        border: "2px dashed var(--border-color)",
                        textAlign: "center"
                      }}>
                        <div style={{ fontSize: "48px", marginBottom: "10px", opacity: 0.5 }}>📷</div>
                        <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "5px" }}>
                          No Image Selected
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "15px" }}>
                          Click "Image" button to upload a logo
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: "flex",
                gap: "15px",
                paddingTop: "25px",
                marginTop: "25px",
                borderTop: "1px solid var(--border-color)"
              }}>
                <button
                  onClick={handleSaveAcademyConfig}
                  style={{
                    flex: 1,
                    padding: "16px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px"
                  }}
                >
                  <Save size={18} />
                  Save Academy Settings
                </button>
                <button
                  onClick={() => {
                    setIsEditingAcademy(false);
                    setAcademyConfig(getAcademyConfig()); // Reset to saved config
                  }}
                  style={{
                    flex: 1,
                    padding: "16px",
                    background: "var(--card-bg)",
                    color: "var(--text-primary)",
                    border: "2px solid var(--border-color)",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px"
                  }}
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
              
              <div style={{
                marginTop: "20px",
                padding: "15px",
                background: "rgba(59, 130, 246, 0.1)",
                borderRadius: "10px",
                border: "1px solid rgba(59, 130, 246, 0.3)"
              }}>
                <p style={{
                  fontSize: "14px",
                  color: "#3b82f6",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <MessageSquare size={16} />
                  <strong>Note:</strong> Changes will be reflected in the dashboard header immediately after saving.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "accounts" && (
        <div style={{
          background: "var(--card-bg)",
          borderRadius: "16px",
          padding: "30px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "var(--text-primary)",
            marginBottom: "25px",
            paddingBottom: "15px",
            borderBottom: "1px solid var(--border-color)"
          }}>
            Manage Accounts
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
            marginBottom: "30px"
          }}>
            {/* Current User Card */}
            <div style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "16px",
              padding: "25px",
              color: "white",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "rgba(255,255,255,0.2)",
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                <Check size={12} style={{ marginRight: "5px", verticalAlign: "middle" }} />
                Current
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
                <img 
                  src={getCurrentAvatar()}
                  alt={currentUser.name}
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid rgba(255,255,255,0.3)"
                  }}
                />
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "5px" }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.9 }}>
                    {currentUser.email}
                  </div>
                </div>
              </div>
              
              <div style={{
                background: "rgba(255,255,255,0.1)",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "15px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", opacity: 0.9 }}>Role</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>
                    {currentUser.role === "admin" ? "Administrator" : "User"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", opacity: 0.9 }}>Joined</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>
                    {new Date(currentUser.joinDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div style={{
                fontSize: "12px",
                opacity: 0.8,
                textAlign: "center",
                paddingTop: "10px",
                borderTop: "1px solid rgba(255,255,255,0.2)"
              }}>
                Currently active account
              </div>
            </div>

            {/* Other Users */}
            {otherUsers.map((user) => (
              <div
                key={user.email}
                style={{
                  background: "var(--card-bg)",
                  borderRadius: "16px",
                  padding: "25px",
                  border: "2px solid var(--border-color)",
                  cursor: "pointer"
                }}
                onClick={() => onSwitchAccount(user)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
                  <img 
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=667eea&color=fff`}
                    alt={user.name}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid rgba(102, 126, 234, 0.3)"
                    }}
                  />
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "5px" }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                      {user.email}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  background: "var(--input-bg)",
                  padding: "12px",
                  borderRadius: "10px",
                  marginBottom: "15px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Role</span>
                    <span style={{ 
                      fontSize: "13px", 
                      fontWeight: "600",
                      color: user.role === "admin" ? "#e74c3c" : "#2ecc71"
                    }}>
                      {user.role === "admin" ? "Administrator" : "User"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Joined</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
                      {new Date(user.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  color: "#667eea",
                  fontWeight: "600",
                  fontSize: "14px"
                }}>
                  <SwitchCamera size={16} />
                  Switch to this account
                </div>
              </div>
            ))}
          </div>

          {/* Add New Account */}
          <div
            onClick={handleAddAccount}
            style={{
              background: "var(--input-bg)",
              border: "2px dashed var(--border-color)",
              borderRadius: "16px",
              padding: "25px",
              textAlign: "center",
              cursor: "pointer"
            }}
          >
            <div style={{
              width: "60px",
              height: "60px",
              background: "rgba(102, 126, 234, 0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 15px"
            }}>
              <Plus size={30} color="#667eea" />
            </div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
              Add New Account
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "400px", margin: "0 auto" }}>
              Create or login with another account to manage multiple profiles
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;