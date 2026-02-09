// pages/Settings.jsx
import React, { useState, useEffect } from "react";
import { 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Plus,
  AlertTriangle,
  Database,
  Download,
  Upload,
  User,
  DollarSign,
  RefreshCw,
  Bell,
  Palette,
  Shield,
  FileText,
  CheckCircle,
  Sun,
  Moon
} from "lucide-react";

const Settings = ({ 
  fees = [], 
  setFees, 
  setStudents, 
  setStudentFees,
  systemSettings,
  setSystemSettings,
  currentTheme,
  setCurrentTheme // New prop for theme management
}) => {
  const [editingFee, setEditingFee] = useState(null);
  const [newFee, setNewFee] = useState({ feeName: "", amount: "" });
  const [activeTab, setActiveTab] = useState("fees");
  const [exportData, setExportData] = useState("");
  const [importData, setImportData] = useState("");
  
  // Local form state for system settings
  const [settingsForm, setSettingsForm] = useState(systemSettings);

  // Update local form when systemSettings change
  useEffect(() => {
    setSettingsForm(systemSettings);
  }, [systemSettings]);

  // Apply theme changes immediately
  useEffect(() => {
    if (currentTheme) {
      applyTheme(currentTheme);
    }
  }, [currentTheme]);

  // Apply theme to entire app
  const applyTheme = (theme) => {
    document.body.classList.remove("light-theme", "dark-theme", "blue-theme");
    document.body.classList.add(`${theme}-theme`);
    
    // Save to localStorage for persistence
    localStorage.setItem("app-theme", theme);
  };

  // Save system settings with immediate effect
  const saveSystemSettings = () => {
    const newSettings = { ...settingsForm };
    
    // Apply theme change immediately
    if (newSettings.theme !== currentTheme) {
      setCurrentTheme(newSettings.theme);
      applyTheme(newSettings.theme);
    }
    
    // Apply currency change to existing fees and students
    if (newSettings.currency !== systemSettings.currency) {
      // Update all existing fees to use new currency symbol in display
      const updatedFees = fees.map(fee => ({
        ...fee,
        displayAmount: `${newSettings.currency}${fee.amount}`
      }));
      setFees(updatedFees);
      
      // Update localStorage with new currency
      const students = JSON.parse(localStorage.getItem("students") || "[]");
      const updatedStudents = students.map(student => ({
        ...student,
        // You can add currency-specific formatting here if needed
      }));
      localStorage.setItem("students", JSON.stringify(updatedStudents));
    }
    
    // Save all settings
    setSystemSettings(newSettings);
    
    // Update localStorage
    const currentSettings = JSON.parse(localStorage.getItem("systemSettings") || "{}");
    const mergedSettings = { ...currentSettings, ...newSettings };
    localStorage.setItem("systemSettings", JSON.stringify(mergedSettings));
    
    alert("✅ System settings saved successfully!");
  };

  // Add new fee type with currency formatting
  const handleAddFee = () => {
    if (!newFee.feeName.trim() || !newFee.amount) {
      alert("Please fill all fields!");
      return;
    }

    const newFeeItem = {
      id: Date.now(),
      feeName: newFee.feeName.trim(),
      amount: Number(newFee.amount),
      displayAmount: `${systemSettings.currency}${Number(newFee.amount).toLocaleString()}`
    };

    const updatedFees = [...fees, newFeeItem];
    setFees(updatedFees);
    
    // Update localStorage
    localStorage.setItem("feeTypes", JSON.stringify(updatedFees));
    
    setNewFee({ feeName: "", amount: "" });
    alert("✅ Fee type added successfully!");
  };

  // Start editing fee
  const handleEditFee = (fee) => {
    setEditingFee({ ...fee });
  };

  // Save edited fee with proper currency formatting
  const handleSaveEdit = () => {
    if (!editingFee.feeName.trim() || !editingFee.amount) {
      alert("Please fill all fields!");
      return;
    }

    const updatedFee = {
      ...editingFee,
      displayAmount: `${systemSettings.currency}${Number(editingFee.amount).toLocaleString()}`
    };

    const updatedFees = fees.map(fee => 
      fee.id === editingFee.id ? updatedFee : fee
    );
    
    setFees(updatedFees);
    localStorage.setItem("feeTypes", JSON.stringify(updatedFees));
    setEditingFee(null);
    alert("✅ Fee updated successfully!");
  };

  // Delete fee type
  const handleDeleteFee = (id) => {
    if (window.confirm("Are you sure you want to delete this fee type?")) {
      const updatedFees = fees.filter(fee => fee.id !== id);
      setFees(updatedFees);
      localStorage.setItem("feeTypes", JSON.stringify(updatedFees));
      alert("✅ Fee type deleted successfully!");
    }
  };

  // Export all data
  const handleExportAllData = () => {
    const allData = {
      students: JSON.parse(localStorage.getItem("students") || "[]"),
      feeTypes: JSON.parse(localStorage.getItem("feeTypes") || "[]"),
      studentFees: JSON.parse(localStorage.getItem("studentFees") || "[]"),
      courses: JSON.parse(localStorage.getItem("courses") || "[]"),
      systemSettings: JSON.parse(localStorage.getItem("systemSettings") || "{}"),
      exportDate: new Date().toISOString(),
      version: "1.0.0"
    };

    const dataStr = JSON.stringify(allData, null, 2);
    setExportData(dataStr);
    
    // Create download link
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `codehub_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert("✅ All data exported successfully!");
  };

  // Import data
  const handleImportData = () => {
    if (!importData.trim()) {
      alert("Please paste JSON data to import!");
      return;
    }

    try {
      const importedData = JSON.parse(importData);
      
      if (window.confirm("⚠️ This will overwrite ALL existing data. Are you sure?")) {
        if (importedData.students) {
          localStorage.setItem("students", JSON.stringify(importedData.students));
          setStudents(importedData.students);
        }
        
        if (importedData.feeTypes) {
          localStorage.setItem("feeTypes", JSON.stringify(importedData.feeTypes));
          setFees(importedData.feeTypes);
        }
        
        if (importedData.studentFees) {
          localStorage.setItem("studentFees", JSON.stringify(importedData.studentFees));
          setStudentFees(importedData.studentFees);
        }
        
        if (importedData.courses) {
          localStorage.setItem("courses", JSON.stringify(importedData.courses));
        }
        
        if (importedData.systemSettings) {
          const newSettings = importedData.systemSettings;
          localStorage.setItem("systemSettings", JSON.stringify(newSettings));
          setSystemSettings(newSettings);
          
          // Apply imported theme
          if (newSettings.theme) {
            setCurrentTheme(newSettings.theme);
            applyTheme(newSettings.theme);
          }
        }
        
        setImportData("");
        alert("✅ Data imported successfully! Page will refresh...");
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      alert("❌ Invalid JSON data! Please check your backup file.");
      console.error(error);
    }
  };

  // Reset all data
  const handleResetAllData = () => {
    const warningText = `⚠️ WARNING: This will DELETE ALL data including:
• All students (${JSON.parse(localStorage.getItem("students") || "[]").length} students)
• All fee types (${fees.length} types)
• All payment records (${JSON.parse(localStorage.getItem("studentFees") || "[]").length} payments)
• All courses
• All system settings

This action CANNOT be undone!

Are you absolutely sure?`;

    if (window.confirm(warningText)) {
      localStorage.removeItem("students");
      localStorage.removeItem("feeTypes");
      localStorage.removeItem("studentFees");
      localStorage.removeItem("courses");
      localStorage.removeItem("systemSettings");
      
      // Reset to default settings
      const defaultSettings = {
        academyName: "CodeHub Tech Academy",
        currency: "₹",
        dateFormat: "DD/MM/YYYY",
        receiptFooter: "Thank you for choosing CodeHub Tech Academy!",
        enableNotifications: true,
        theme: "light",
        autoGenerateId: true,
        receiptPrefix: "CH"
      };
      
      setStudents([]);
      setFees([]);
      setStudentFees([]);
      setSystemSettings(defaultSettings);
      setCurrentTheme("light");
      applyTheme("light");
      
      // Save default settings
      localStorage.setItem("systemSettings", JSON.stringify(defaultSettings));
      
      alert("✅ All data has been reset! Page will refresh...");
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  // Get system statistics
  const getSystemStats = () => {
    const students = JSON.parse(localStorage.getItem("students") || "[]");
    const studentFeesData = JSON.parse(localStorage.getItem("studentFees") || "[]");
    
    const totalCollected = studentFeesData.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const totalDue = students.reduce((sum, s) => sum + (Number(s.feeDue) || 0), 0);
    
    return {
      totalStudents: students.length,
      totalFeeTypes: fees.length,
      totalPayments: studentFeesData.length,
      totalCollected: totalCollected,
      totalDue: totalDue,
      storageUsed: (JSON.stringify(localStorage).length / 1024).toFixed(2) + " KB"
    };
  };

  const stats = getSystemStats();

  // Theme preview function
  const ThemePreview = ({ theme }) => {
    const isActive = settingsForm.theme === theme;
    const themeColors = {
      light: { bg: "#ffffff", text: "#1a202c", border: "#e2e8f0" },
      dark: { bg: "#1a202c", text: "#f7fafc", border: "#4a5568" },
      blue: { bg: "#ebf8ff", text: "#2d3748", border: "#90cdf4" }
    };
    
    return (
      <div 
        onClick={() => setSettingsForm({...settingsForm, theme})}
        style={{
          flex: 1,
          padding: "15px",
          borderRadius: "10px",
          cursor: "pointer",
          border: `2px solid ${isActive ? "#667eea" : themeColors[theme].border}`,
          backgroundColor: themeColors[theme].bg,
          color: themeColors[theme].text,
          textAlign: "center",
          transition: "all 0.3s"
        }}
      >
        {theme === "light" ? <Sun size={20} /> : theme === "dark" ? <Moon size={20} /> : <Palette size={20} />}
        <div style={{ marginTop: "8px", fontWeight: "600", textTransform: "capitalize" }}>
          {theme} Theme
        </div>
        {isActive && (
          <div style={{ marginTop: "5px", fontSize: "12px", color: "#667eea" }}>
            ✓ Active
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "20px", minHeight: "calc(100vh - 60px)" }}>
      {/* Header */}
      <div style={{ marginBottom: "30px", padding: "20px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "12px", color: "white" }}>
        <div style={{ fontSize: "24px", fontWeight: "700", marginBottom: "5px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Shield size={28} />
          Settings & Configuration
        </div>
        <div style={{ opacity: 0.9, fontSize: "14px" }}>
          Academy: {systemSettings.academyName} | Currency: {systemSettings.currency} | Theme: {systemSettings.theme}
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", textAlign: "center", border: "1px solid var(--border-color)", transition: "transform 0.3s" }}>
          <div style={{ width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
            <User size={24} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", marginBottom: "5px", color: "#667eea" }}>{stats.totalStudents}</div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>Total Students</div>
        </div>
        
        <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", textAlign: "center", border: "1px solid var(--border-color)" }}>
          <div style={{ width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
            <DollarSign size={24} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", marginBottom: "5px", color: "#f5576c" }}>{stats.totalFeeTypes}</div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>Fee Types</div>
        </div>
        
        <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", textAlign: "center", border: "1px solid var(--border-color)" }}>
          <div style={{ width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px", background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white" }}>
            <Database size={24} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", marginBottom: "5px", color: "#4facfe" }}>{stats.totalPayments}</div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>Total Payments</div>
        </div>
        
        <div style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", textAlign: "center", border: "1px solid var(--border-color)" }}>
          <div style={{ width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px", background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", color: "white" }}>
            <CheckCircle size={24} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", marginBottom: "5px", color: "#43e97b" }}>{systemSettings.currency}{stats.totalCollected.toLocaleString()}</div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>Total Collected</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "var(--card-bg)", borderRadius: "10px", padding: "5px", marginBottom: "25px", border: "1px solid var(--border-color)" }}>
        <button style={{ flex: 1, padding: "12px 15px", border: "none", background: activeTab === "fees" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: activeTab === "fees" ? "white" : "var(--text-primary)" }} onClick={() => setActiveTab("fees")}>
          <DollarSign size={16} /> Fee Types
        </button>
        
        <button style={{ flex: 1, padding: "12px 15px", border: "none", background: activeTab === "system" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: activeTab === "system" ? "white" : "var(--text-primary)" }} onClick={() => setActiveTab("system")}>
          <Shield size={16} /> System Settings
        </button>
        
        <button style={{ flex: 1, padding: "12px 15px", border: "none", background: activeTab === "data" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: activeTab === "data" ? "white" : "var(--text-primary)" }} onClick={() => setActiveTab("data")}>
          <Database size={16} /> Data Management
        </button>
        
        <button style={{ flex: 1, padding: "12px 15px", border: "none", background: activeTab === "danger" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: activeTab === "danger" ? "white" : "var(--text-primary)" }} onClick={() => setActiveTab("danger")}>
          <AlertTriangle size={16} /> Danger Zone
        </button>
      </div>

      {/* Fee Types Tab */}
      {activeTab === "fees" && (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", padding: "25px", marginBottom: "25px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px", paddingBottom: "15px", borderBottom: "2px solid var(--border-light)" }}>
            <DollarSign size={20} /> Manage Fee Types
          </h3>
          
          {/* Add New Fee Form */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "15px", color: "var(--text-primary)", fontSize: "16px" }}>Add New Fee Type</h4>
            <div style={{ display: "flex", gap: "15px", alignItems: "flex-end" }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-primary)", fontSize: "14px" }}>Fee Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g., Tuition Fee, Exam Fee, Library Fee, etc." 
                  value={newFee.feeName} 
                  onChange={(e) => setNewFee({...newFee, feeName: e.target.value})} 
                  style={{ width: "100%", padding: "12px 15px", border: "2px solid var(--border-color)", borderRadius: "8px", fontSize: "14px", transition: "border 0.3s", backgroundColor: "var(--input-bg)", color: "var(--text-primary)" }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-primary)", fontSize: "14px" }}>Amount ({systemSettings.currency}) *</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={newFee.amount} 
                  onChange={(e) => setNewFee({...newFee, amount: e.target.value})} 
                  style={{ width: "100%", padding: "12px 15px", border: "2px solid var(--border-color)", borderRadius: "8px", fontSize: "14px", transition: "border 0.3s", backgroundColor: "var(--input-bg)", color: "var(--text-primary)" }} 
                  min="0" 
                  step="50" 
                />
              </div>
              <button 
                onClick={handleAddFee} 
                style={{ padding: "12px 24px", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}
              >
                <Plus size={16} /> Add Fee
              </button>
            </div>
          </div>

          {/* Fee Types List */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "15px", color: "var(--text-primary)", fontSize: "16px" }}>
              Existing Fee Types ({fees.length})
            </h4>
            
            {fees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--text-secondary)", backgroundColor: "var(--input-bg)", borderRadius: "10px", border: "2px dashed var(--border-color)" }}>
                <DollarSign size={48} style={{ marginBottom: "15px", opacity: 0.5 }} />
                <h4 style={{ margin: "0 0 10px 0", color: "var(--text-secondary)" }}>No Fee Types Found</h4>
                <p style={{ margin: 0 }}>Add your first fee type using the form above</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "var(--input-bg)", borderBottom: "2px solid var(--border-color)" }}>
                    <tr>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "700", color: "var(--text-primary)", fontSize: "13px", textTransform: "uppercase" }}>#</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "700", color: "var(--text-primary)", fontSize: "13px", textTransform: "uppercase" }}>Fee Name</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "700", color: "var(--text-primary)", fontSize: "13px", textTransform: "uppercase" }}>Amount ({systemSettings.currency})</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "700", color: "var(--text-primary)", fontSize: "13px", textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee, index) => (
                      <tr key={fee.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        {editingFee?.id === fee.id ? (
                          // Edit Mode
                          <>
                            <td style={{ padding: "15px", color: "var(--text-primary)" }}>{index + 1}</td>
                            <td style={{ padding: "15px" }}>
                              <input 
                                type="text" 
                                value={editingFee.feeName} 
                                onChange={(e) => setEditingFee({...editingFee, feeName: e.target.value})} 
                                style={{ width: "100%", padding: "10px", border: "2px solid var(--border-color)", borderRadius: "8px", fontSize: "13px", backgroundColor: "var(--input-bg)", color: "var(--text-primary)" }} 
                              />
                            </td>
                            <td style={{ padding: "15px" }}>
                              <input 
                                type="number" 
                                value={editingFee.amount} 
                                onChange={(e) => setEditingFee({...editingFee, amount: e.target.value})} 
                                style={{ width: "100%", padding: "10px", border: "2px solid var(--border-color)", borderRadius: "8px", fontSize: "13px", backgroundColor: "var(--input-bg)", color: "var(--text-primary)" }} 
                                min="0" 
                                step="50" 
                              />
                            </td>
                            <td style={{ padding: "15px" }}>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button 
                                  onClick={handleSaveEdit} 
                                  style={{ padding: "8px 15px", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", background: "#d1fae5", color: "#065f46", border: "2px solid #10b981" }}
                                >
                                  <Save size={14} /> Save
                                </button>
                                <button 
                                  onClick={() => setEditingFee(null)} 
                                  style={{ padding: "8px 15px", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", background: "var(--input-bg)", color: "var(--text-primary)", border: "2px solid var(--border-color)" }}
                                >
                                  <X size={14} /> Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          // View Mode
                          <>
                            <td style={{ padding: "15px", color: "var(--text-primary)" }}>{index + 1}</td>
                            <td style={{ padding: "15px", fontWeight: "600", color: "var(--text-primary)" }}>{fee.feeName}</td>
                            <td style={{ padding: "15px", fontWeight: "700", color: "#667eea", fontSize: "15px" }}>
                              {systemSettings.currency}{Number(fee.amount).toLocaleString()}
                            </td>
                            <td style={{ padding: "15px" }}>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button 
                                  onClick={() => handleEditFee(fee)} 
                                  style={{ padding: "8px 12px", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "#fef3c7", color: "#92400e", border: "2px solid #fbbf24" }}
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteFee(fee.id)} 
                                  style={{ padding: "8px 12px", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "#fee2e2", color: "#dc2626", border: "2px solid #dc2626" }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === "system" && (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", padding: "25px", marginBottom: "25px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px", paddingBottom: "15px", borderBottom: "2px solid var(--border-light)" }}>
            <Shield size={20} /> System Preferences
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-primary)", fontSize: "14px" }}>Academy Name</label>
              <input 
                type="text" 
                value={settingsForm.academyName} 
                onChange={(e) => setSettingsForm({...settingsForm, academyName: e.target.value})} 
                style={{ width: "100%", padding: "12px 15px", border: "2px solid var(--border-color)", borderRadius: "8px", fontSize: "14px", transition: "border 0.3s", backgroundColor: "var(--input-bg)", color: "var(--text-primary)" }} 
              />
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-primary)", fontSize: "14px" }}>Currency Symbol</label>
              <input 
                type="text" 
                value={settingsForm.currency} 
                onChange={(e) => setSettingsForm({...settingsForm, currency: e.target.value})} 
                style={{ width: "100%", padding: "12px 15px", border: "2px solid var(--border-color)", borderRadius: "8px", fontSize: "14px", transition: "border 0.3s", backgroundColor: "var(--input-bg)", color: "var(--text-primary)" }} 
                placeholder="₹, $, €, etc." 
                maxLength="3" 
              />
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "5px" }}>
                Current: {settingsForm.currency} | Preview: {settingsForm.currency}1000
              </div>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-primary)", fontSize: "14px" }}>Date Format</label>
              <select 
                value={settingsForm.dateFormat} 
                onChange={(e) => setSettingsForm({...settingsForm, dateFormat: e.target.value})} 
                style={{ width: "100%", padding: "12px 15px", border: "2px solid var(--border-color)", borderRadius: "8px", fontSize: "14px", transition: "border 0.3s", backgroundColor: "var(--input-bg)", color: "var(--text-primary)" }}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (Indian)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-primary)", fontSize: "14px" }}>Receipt Prefix</label>
              <input 
                type="text" 
                value={settingsForm.receiptPrefix} 
                onChange={(e) => setSettingsForm({...settingsForm, receiptPrefix: e.target.value})} 
                style={{ width: "100%", padding: "12px 15px", border: "2px solid var(--border-color)", borderRadius: "8px", fontSize: "14px", transition: "border 0.3s", backgroundColor: "var(--input-bg)", color: "var(--text-primary)" }} 
                placeholder="CH" 
                maxLength="5" 
              />
            </div>
          </div>
          
          {/* Theme Selection */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-primary)", fontSize: "14px" }}>Theme</label>
            <div style={{ display: "flex", gap: "15px" }}>
              <ThemePreview theme="light" />
              <ThemePreview theme="dark" />
              <ThemePreview theme="blue" />
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "5px" }}>
              Changes apply immediately after saving
            </div>
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-primary)", fontSize: "14px" }}>Receipt Footer Text</label>
            <textarea 
              value={settingsForm.receiptFooter} 
              onChange={(e) => setSettingsForm({...settingsForm, receiptFooter: e.target.value})} 
              style={{ width: "100%", padding: "12px 15px", border: "2px solid var(--border-color)", borderRadius: "8px", fontSize: "14px", transition: "border 0.3s", backgroundColor: "var(--input-bg)", color: "var(--text-primary)" }} 
              rows="3" 
            />
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", marginBottom: "8px", fontWeight: "600", color: "var(--text-primary)", fontSize: "14px" }}>
              <Bell size={16} style={{ marginRight: "8px" }} />
              Enable Notifications
              <div style={{ position: "relative", display: "inline-block", width: "54px", height: "28px", marginLeft: "15px" }}>
                <input 
                  type="checkbox" 
                  checked={settingsForm.enableNotifications} 
                  onChange={(e) => setSettingsForm({...settingsForm, enableNotifications: e.target.checked})} 
                  style={{ display: "none" }} 
                />
                <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: settingsForm.enableNotifications ? "#48bb78" : "#cbd5e1", transition: ".4s", borderRadius: "28px" }}>
                  <span style={{ position: "absolute", height: "20px", width: "20px", left: "4px", bottom: "4px", backgroundColor: "white", transition: ".4s", borderRadius: "50%", transform: settingsForm.enableNotifications ? "translateX(26px)" : "none" }}></span>
                </span>
              </div>
            </label>
          </div>
          
          <button 
            onClick={saveSystemSettings} 
            style={{ padding: "12px 24px", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}
          >
            <Save size={16} /> Save System Settings
          </button>
        </div>
      )}

      {/* Data Management Tab */}
      {activeTab === "data" && (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", padding: "25px", marginBottom: "25px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px", paddingBottom: "15px", borderBottom: "2px solid var(--border-light)" }}>
            <Database size={20} /> Data Management
          </h3>
          
          <div style={{ background: "#fffaf0", border: "2px solid #fed7aa", borderRadius: "10px", padding: "20px", marginBottom: "25px", display: "flex", alignItems: "flex-start", gap: "15px" }}>
            <AlertTriangle size={24} color="#d69e2e" />
            <div>
              <h4 style={{ margin: "0 0 5px 0", color: "#d69e2e" }}>Important Notice</h4>
              <p style={{ margin: 0, color: "#d69e2e", fontSize: "14px" }}>Always backup your data before making changes. Data loss cannot be recovered.</p>
            </div>
          </div>
          
          {/* Export Data */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "15px", color: "var(--text-primary)", fontSize: "16px" }}>
              <Download size={18} style={{ marginRight: "8px" }} /> Export All Data
            </h4>
            <p style={{ marginBottom: "15px", color: "var(--text-secondary)", fontSize: "14px" }}>Download a complete backup of all students, fees, and payment records as a JSON file.</p>
            <button 
              onClick={handleExportAllData} 
              style={{ padding: "12px 24px", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#f0fff4", color: "#38a169", border: "2px solid #c6f6d5" }}
            >
              <Download size={16} /> Export All Data as JSON
            </button>
          </div>
          
          {/* Import Data */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "15px", color: "var(--text-primary)", fontSize: "16px" }}>
              <Upload size={18} style={{ marginRight: "8px" }} /> Import Data
            </h4>
            <p style={{ marginBottom: "15px", color: "var(--text-secondary)", fontSize: "14px" }}>Restore data from a previous backup. This will overwrite existing data.</p>
            <textarea 
              placeholder="Paste your JSON backup data here..." 
              value={importData} 
              onChange={(e) => setImportData(e.target.value)} 
              style={{ width: "100%", padding: "15px", border: "2px solid var(--border-color)", borderRadius: "8px", fontSize: "14px", fontFamily: "'Monaco', 'Courier New', monospace", backgroundColor: "var(--input-bg)", color: "var(--text-primary)", minHeight: "200px", resize: "vertical", lineHeight: "1.5" }} 
            />
            <button 
              onClick={handleImportData} 
              style={{ padding: "12px 24px", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "var(--input-bg)", color: "var(--text-primary)", border: "2px solid var(--border-color)", marginTop: "15px" }}
            >
              <Upload size={16} /> Import Data from JSON
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === "danger" && (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", padding: "25px", marginBottom: "25px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px", paddingBottom: "15px", borderBottom: "2px solid var(--border-light)" }}>
            <AlertTriangle size={20} color="#e53e3e" /> Danger Zone
          </h3>
          
          <div style={{ background: "#fff5f5", border: "2px solid #fc8181", borderRadius: "10px", padding: "20px", marginBottom: "25px", display: "flex", alignItems: "flex-start", gap: "15px" }}>
            <AlertTriangle size={24} color="#e53e3e" />
            <div>
              <h4 style={{ margin: "0 0 5px 0", color: "#e53e3e" }}>⚠️ EXTREME WARNING ⚠️</h4>
              <p style={{ margin: 0, color: "#e53e3e", fontSize: "14px" }}>Actions in this section are IRREVERSIBLE. Proceed with extreme caution.</p>
            </div>
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "15px", color: "#e53e3e", fontSize: "16px" }}>Reset All Data</h4>
            <p style={{ marginBottom: "15px", color: "var(--text-secondary)", fontSize: "14px" }}>This will delete ALL students, fees, payment records, and settings. The system will be restored to its initial state.</p>
            <button 
              onClick={handleResetAllData} 
              style={{ padding: "12px 24px", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#fff5f5", color: "#e53e3e", border: "2px solid #fed7d7" }}
            >
              <Trash2 size={16} /> Reset All Data
            </button>
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "15px", color: "#e53e3e", fontSize: "16px" }}>Clear Browser Storage</h4>
            <p style={{ marginBottom: "15px", color: "var(--text-secondary)", fontSize: "14px" }}>Clear all data stored in your browser's local storage. This will log you out.</p>
            <button onClick={() => {
              if (window.confirm("Clear ALL browser storage? This will delete everything and log you out!")) {
                localStorage.clear();
                alert("✅ Storage cleared! Page will reload...");
                setTimeout(() => window.location.reload(), 1000);
              }
            }} style={{ padding: "12px 24px", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#fff5f5", color: "#e53e3e", border: "2px solid #fed7d7" }}>
              <RefreshCw size={16} /> Clear Browser Storage
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;