// src/utils/logoDebug.js
export const checkLogoConfig = () => {
  const savedConfig = localStorage.getItem('academyConfig');
  console.log('=== LOGO DEBUG ===');
  console.log('Raw saved config:', savedConfig);
  
  if (!savedConfig) {
    console.log('No config found in localStorage');
    return null;
  }
  
  try {
    const parsed = JSON.parse(savedConfig);
    console.log('Parsed config:', parsed);
    console.log('Logo object:', parsed.logo);
    console.log('Logo type:', typeof parsed.logo);
    console.log('Logo show:', parsed.logo?.show);
    console.log('Logo content exists:', !!parsed.logo?.content);
    console.log('Logo content type:', typeof parsed.logo?.content);
    
    // Check if config has old format
    if (parsed.logoType || parsed.showLogo !== undefined) {
      console.log('⚠️ Config has OLD format!');
      console.log('logoType:', parsed.logoType);
      console.log('showLogo:', parsed.showLogo);
      console.log('logo (string):', parsed.logo);
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing config:', error);
    return null;
  }
};

export const fixLogoConfig = () => {
  const config = checkLogoConfig();
  if (!config) return null;
  
  let updated = false;
  
  // If config has old format, migrate to new
  if (config.logoType || config.showLogo !== undefined) {
    console.log('Migrating old config to new format...');
    
    const newConfig = {
      ...config,
      logo: {
        type: config.logoType || (config.logo?.startsWith('data:image') ? 'image' : 'emoji'),
        content: config.logo || '🎓',
        show: config.showLogo !== undefined ? config.showLogo : true,
        size: 'medium',
        style: 'circle'
      }
    };
    
    // Remove old properties
    delete newConfig.logoType;
    delete newConfig.showLogo;
    
    localStorage.setItem('academyConfig', JSON.stringify(newConfig));
    console.log('Config migrated successfully!');
    updated = true;
    
    return newConfig;
  }
  
  // If config has new format but logo is missing
  if (!config.logo || typeof config.logo !== 'object') {
    console.log('Fixing missing logo object...');
    
    const newConfig = {
      ...config,
      logo: {
        type: 'emoji',
        content: '🎓',
        show: true,
        size: 'medium',
        style: 'circle'
      }
    };
    
    localStorage.setItem('academyConfig', JSON.stringify(newConfig));
    console.log('Logo object added!');
    updated = true;
    
    return newConfig;
  }
  
  if (!updated) {
    console.log('Logo config looks good!');
  }
  
  return config;
};

// Run this in browser console to debug
export const runLogoDebug = () => {
  console.log('Running logo debug...');
  const result = fixLogoConfig();
  
  if (result) {
    console.log('Final config:', result);
    console.log('Logo should now display correctly.');
    console.log('Refresh the page to see changes.');
  }
  
  return result;
};