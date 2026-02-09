// components/Sidebar.jsx - UPDATED (Logo removed)
import React, { useState } from 'react';
import {
  Home,
  Users,
  UserPlus,
  Calendar,
  TrendingUp,
  BookOpen,
  DollarSign,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  User,
  ChevronDown,
  CreditCard,
  Bell,
  Mail,
  Phone,
  Menu,
  X
} from "lucide-react";

const Sidebar = ({
  activeMenu,
  setActiveMenu = () => {},
  setEditingStudent = () => {},
  collapsed = false,
  currentTheme = "light",
  currentUser,
  onLogout
}) => {
  const [openDropdown, setOpenDropdown] = useState({
    student: false,
    classSection: false,
    fees: false
  });

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const menuItems = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: <Home size={20} />, 
      hasDropdown: false 
    },
    {
      id: 'student',
      name: 'Student',
      icon: <Users size={20} />,
      hasDropdown: true,
      subItems: [
        { id: 'new-admission', name: 'New Admission' },
        { id: 'student-list', name: 'Student List' },
        { id: 'monthwise-student-list', name: 'Month Wise Student List' },
        { id: 'promote-student', name: 'Promote Student' }
      ]
    },
    {
      id: 'classSection',
      name: 'Courses',
      icon: <BookOpen size={20} />,
      hasDropdown: true,
      subItems: [{ id: 'class', name: 'Courses' }]
    },
    {
      id: 'fees',
      name: 'Fees',
      icon: <DollarSign size={20} />,
      hasDropdown: true,
      subItems: [
        { id: 'collect-fees', name: 'Collect Fees' },
        { id: 'due-fees', name: 'Get Due Fees' },
        { id: 'fees-type', name: 'Fees Type' }
      ]
    },
    { 
      id: 'send-sms', 
      name: 'Send SMS', 
      icon: <MessageSquare size={20} />, 
      hasDropdown: false 
    },
    { 
      id: 'reports', 
      name: 'Report', 
      icon: <FileText size={20} />, 
      hasDropdown: false 
    },
    { 
      id: 'slip', 
      name: 'Slip', 
      icon: <CreditCard size={20} />, 
      hasDropdown: false 
    },
    { 
      id: 'profile',
      name: 'My Profile', 
      icon: <User size={20} />, 
      hasDropdown: false 
    },
    { 
      id: 'settings', 
      name: 'Settings', 
      icon: <Settings size={20} />, 
      hasDropdown: false 
    }
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{
      width: collapsed ? "70px" : "250px",
      background: "linear-gradient(180deg, var(--secondary-color), var(--dark-color))",
      color: "white",
      height: "100vh",
      position: "fixed",
      transition: "width 0.3s ease",
      overflowY: "auto",
      boxShadow: "3px 0 10px rgba(0, 0, 0, 0.2)",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header - Simplified (Logo removed) */}
      <div style={{
        padding: collapsed ? "15px 10px" : "15px 20px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        minHeight: "60px"
      }}>
        {collapsed ? (
          <div style={{
            background: "rgba(255, 255, 255, 0.1)",
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white"
          }}>
            <Menu size={20} />
          </div>
        ) : (
          <div style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: "8px 16px",
            borderRadius: "8px",
            color: "white",
            fontWeight: "600",
            fontSize: "14px",
            letterSpacing: "0.5px"
          }}>
            Academy System
          </div>
        )}
      </div>

      {/* User Profile Section */}
      {currentUser && !collapsed && (
        <div style={{
          padding: "20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          position: "relative"
        }}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              padding: "10px",
              borderRadius: "10px",
              background: showProfileMenu ? "rgba(255,255,255,0.1)" : "transparent",
              transition: "all 0.3s"
            }}
          >
            <img 
              src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}&background=667eea&color=fff`} 
              alt={currentUser.name}
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.3)"
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "600", fontSize: "15px" }}>{currentUser.name}</div>
              <div style={{ 
                fontSize: "12px", 
                opacity: 0.8,
                background: "rgba(255,255,255,0.1)",
                padding: "2px 8px",
                borderRadius: "4px",
                display: "inline-block",
                marginTop: "3px"
              }}>
                {currentUser.role || "Admin"}
              </div>
            </div>
            <ChevronDown size={16} style={{
              transform: showProfileMenu ? "rotate(180deg)" : "none",
              transition: "transform 0.3s"
            }} />
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: "20px",
              right: "20px",
              background: "var(--card-bg)",
              borderRadius: "10px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              zIndex: 1000,
              marginTop: "10px",
              overflow: "hidden",
              border: "1px solid var(--border-color)"
            }}>
              <div style={{ padding: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "15px" }}>
                  <img 
                    src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}&background=667eea&color=fff`} 
                    alt={currentUser.name}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      objectFit: "cover"
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{currentUser.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{currentUser.email}</div>
                    <div style={{ 
                      fontSize: "11px", 
                      color: "#667eea",
                      marginTop: "3px"
                    }}>
                      {currentUser.role === "admin" ? "Administrator" : "User"}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  background: "var(--input-bg)",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "15px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <Mail size={14} style={{ color: "var(--text-secondary)" }} />
                    <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{currentUser.email}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Calendar size={14} style={{ color: "var(--text-secondary)" }} />
                    <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                      Joined {new Date(currentUser.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveMenu("profile");
                    setShowProfileMenu(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "var(--input-bg)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "center",
                    marginBottom: "10px",
                    transition: "all 0.3s"
                  }}
                >
                  <User size={16} />
                  Manage Profile
                </button>

                <button
                  onClick={onLogout}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "center",
                    fontWeight: "600",
                    transition: "all 0.3s"
                  }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Menu Items */}
      <div style={{ 
        flex: 1, 
        padding: "15px 0",
        overflowY: "auto"
      }}>
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.hasDropdown ? (
              <>
                <div
                  onClick={() => toggleDropdown(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: collapsed ? "12px 15px" : "12px 20px",
                    color: activeMenu === item.id ? "white" : "#bdc3c7",
                    textDecoration: "none",
                    borderRadius: "0",
                    transition: "all 0.3s",
                    cursor: "pointer",
                    background: activeMenu === item.id 
                      ? "rgba(255, 255, 255, 0.15)" 
                      : "transparent",
                    borderRight: activeMenu === item.id 
                      ? "4px solid #3498db" 
                      : "none",
                    margin: "2px 0"
                  }}
                >
                  <div style={{ 
                    marginRight: collapsed ? "0" : "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    color: activeMenu === item.id ? "#3498db" : "inherit"
                  }}>
                    {item.icon}
                  </div>
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1, fontSize: "14px", fontWeight: "500" }}>
                        {item.name}
                      </span>
                      <ChevronDown 
                        size={16} 
                        style={{
                          transform: openDropdown[item.id] ? "rotate(180deg)" : "none",
                          transition: "transform 0.3s"
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Submenu */}
                {!collapsed && openDropdown[item.id] && (
                  <div style={{
                    background: "rgba(0, 0, 0, 0.2)",
                    borderRadius: "0",
                    margin: "0 0 0 0"
                  }}>
                    {item.subItems.map((subItem) => (
                      <div
                        key={subItem.id}
                        onClick={() => {
                          if (subItem.id === 'new-admission') {
                            setEditingStudent(null);
                          }
                          setActiveMenu(subItem.id);
                        }}
                        style={{
                          padding: "10px 20px 10px 55px",
                          fontSize: "13px",
                          color: activeMenu === subItem.id ? "white" : "#bdc3c7",
                          cursor: "pointer",
                          transition: "all 0.3s",
                          background: activeMenu === subItem.id 
                            ? "rgba(255, 255, 255, 0.1)" 
                            : "transparent",
                          borderRight: activeMenu === subItem.id 
                            ? "4px solid #3498db" 
                            : "none"
                        }}
                      >
                        {subItem.name}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                onClick={() => setActiveMenu(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: collapsed ? "12px 15px" : "12px 20px",
                  color: activeMenu === item.id ? "white" : "#bdc3c7",
                  textDecoration: "none",
                  borderRadius: "0",
                  transition: "all 0.3s",
                  cursor: "pointer",
                  background: activeMenu === item.id 
                    ? "rgba(255, 255, 255, 0.15)" 
                    : "transparent",
                  borderRight: activeMenu === item.id 
                    ? "4px solid #3498db" 
                    : "none",
                  margin: "2px 0"
                }}
              >
                <div style={{ 
                  marginRight: collapsed ? "0" : "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  color: activeMenu === item.id ? "#3498db" : "inherit"
                }}>
                  {item.icon}
                </div>
                {!collapsed && (
                  <span style={{ flex: 1, fontSize: "14px", fontWeight: "500" }}>
                    {item.name}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mini Profile for Collapsed Mode */}
      {collapsed && currentUser && (
        <div style={{ 
          padding: "20px 15px", 
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "15px"
        }}>
          <div style={{ position: "relative" }}>
            <img 
              src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}&background=667eea&color=fff`} 
              alt={currentUser.name}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.3)",
                cursor: "pointer"
              }}
              onClick={() => setActiveMenu("profile")}
              title="My Profile"
            />
            <div style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              width: "12px",
              height: "12px",
              background: "#10b981",
              borderRadius: "50%",
              border: "2px solid var(--secondary-color)"
            }}></div>
          </div>
          
          <button
            onClick={onLogout}
            style={{
              background: "none",
              border: "none",
              color: "#e74c3c",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "6px",
              transition: "all 0.3s"
            }}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      )}

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: "15px 20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          fontSize: "11px",
          opacity: 0.6,
          textAlign: "center"
        }}>
          <div>v2.0.0</div>
          <div style={{ marginTop: "3px" }}>Management System</div>
        </div>
      )}

      <style>
        {`
          .sidebar::-webkit-scrollbar {
            width: 5px;
          }
          
          .sidebar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
          }
          
          .sidebar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          
          .sidebar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          
          .sidebar div[style*="cursor: pointer"]:hover {
            background: rgba(255, 255, 255, 0.1) !important;
          }
        `}
      </style>
    </div>
  );
};

export default Sidebar;