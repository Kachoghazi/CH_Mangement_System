// utils/LocalStorageDB.js
class LocalStorageDB {
  constructor(storageKey, transformFunc = null) {
    this.storageKey = storageKey;
    this.transformFunc = transformFunc;
    this.data = this.loadData();
    
    // Auto-save on page unload
    window.addEventListener('beforeunload', () => this.saveAll());
  }

  loadData() {
    try {
      let data = localStorage.getItem(this.storageKey);
      
      if (!data) {
        // Try backup
        data = localStorage.getItem(`${this.storageKey}_backup`);
      }
      
      if (!data) {
        // Try session storage
        data = sessionStorage.getItem(this.storageKey);
      }
      
      if (data) {
        const parsed = JSON.parse(data);
        // If a transform function is provided, use it
        return this.transformFunc ? this.transformFunc(parsed) : (Array.isArray(parsed) ? parsed : []);
      }
      
      return [];
    } catch (error) {
      console.error(`Load error for ${this.storageKey}:`, error);
      return [];
    }
  }

  saveAll() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      localStorage.setItem(`${this.storageKey}_backup`, JSON.stringify(this.data));
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.data));
      
      console.log(`💾 Saved ${this.data.length} items to ${this.storageKey}`);
      return true;
    } catch (error) {
      console.error(`Save error for ${this.storageKey}:`, error);
      return false;
    }
  }

  addItem(item) {
    const newItem = {
      ...item,
      id: Date.now() + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.data.push(newItem);
    this.saveAll();
    return newItem;
  }

  updateItem(id, updatedData) {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index] = {
        ...this.data[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      this.saveAll();
      return this.data[index];
    }
    return null;
  }

  deleteItem(id) {
    this.data = this.data.filter(item => item.id !== id);
    this.saveAll();
    return true;
  }

  getAll() {
    return [...this.data];
  }

  clear() {
    this.data = [];
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(`${this.storageKey}_backup`);
    sessionStorage.removeItem(this.storageKey);
    return true;
  }

  getStats() {
    return {
      totalItems: this.data.length,
      lastUpdated: this.data.length > 0 
        ? new Date(this.data[0].updatedAt || this.data[0].createdAt).toLocaleString()
        : 'Never'
    };
  }
}

export default LocalStorageDB;