// src/config/academyConfig.js
// Academy Configuration Module - UPDATED WITH LOGO SUPPORT

// Default academy configuration
const DEFAULT_ACADEMY_CONFIG = {
  name: "Code Hub Academy",
  tagline: "Coding Excellence, Future Success",
  description: "Premium coding education for aspiring developers",
  
  // Logo Configuration
  showLogo: true,
  logo: "💻", // Default emoji logo
  logoType: "emoji", // 'emoji', 'text', or 'image'
  
  theme: {
    primaryColor: "#3b82f6",
    secondaryColor: "#1d4ed8"
  },
  
  fees: {
    currency: "₹",
    currencySymbol: "₹",
    receiptHeader: "CODE HUB ACADEMY",
    receiptFooter: "Thank you for your payment!"
  },
  
  contact: {
    phone: "+91 98765 43210",
    email: "info@codehubacademy.com",
    address: "123 Tech Street, Silicon Valley, Bangalore"
  },
  
  // Additional settings
  settings: {
    autoBackup: true,
    sendReceipts: true,
    enableNotifications: true
  }
};

// Get academy configuration from localStorage or return default
export const getAcademyConfig = () => {
  try {
    const savedConfig = localStorage.getItem('academyConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      // Merge with defaults to ensure all properties exist
      return {
        ...DEFAULT_ACADEMY_CONFIG,
        ...parsed,
        theme: {
          ...DEFAULT_ACADEMY_CONFIG.theme,
          ...(parsed.theme || {})
        },
        fees: {
          ...DEFAULT_ACADEMY_CONFIG.fees,
          ...(parsed.fees || {})
        },
        contact: {
          ...DEFAULT_ACADEMY_CONFIG.contact,
          ...(parsed.contact || {})
        },
        settings: {
          ...DEFAULT_ACADEMY_CONFIG.settings,
          ...(parsed.settings || {})
        }
      };
    }
    return DEFAULT_ACADEMY_CONFIG;
  } catch (error) {
    console.error('Error loading academy config:', error);
    return DEFAULT_ACADEMY_CONFIG;
  }
};

// Update academy configuration
export const updateAcademyConfig = (newConfig) => {
  try {
    // Merge with existing config to preserve any missing properties
    const existingConfig = getAcademyConfig();
    const updatedConfig = {
      ...existingConfig,
      ...newConfig,
      theme: {
        ...existingConfig.theme,
        ...(newConfig.theme || {})
      },
      fees: {
        ...existingConfig.fees,
        ...(newConfig.fees || {})
      },
      contact: {
        ...existingConfig.contact,
        ...(newConfig.contact || {})
      },
      settings: {
        ...existingConfig.settings,
        ...(newConfig.settings || {})
      }
    };
    
    localStorage.setItem('academyConfig', JSON.stringify(updatedConfig));
    
    // Dispatch event to notify other components about the update
    window.dispatchEvent(new Event('academyConfigUpdated'));
    
    return updatedConfig;
  } catch (error) {
    console.error('Error updating academy config:', error);
    throw error;
  }
};

// Reset to default configuration
export const resetAcademyConfig = () => {
  localStorage.removeItem('academyConfig');
  window.dispatchEvent(new Event('academyConfigUpdated'));
  return DEFAULT_ACADEMY_CONFIG;
};

// Export default config for reference
export default DEFAULT_ACADEMY_CONFIG;