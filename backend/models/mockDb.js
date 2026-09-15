const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data_fallback.json');

// Initialize local database file if it doesn't exist
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify({
    users: [],
    products: [],
    messages: []
  }, null, 2));
}

const loadData = () => {
  try {
    const content = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return { users: [], products: [], messages: [] };
  }
};

const saveData = (data) => {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving mock database data:', err);
  }
};

// Auto-populate some sample products if the mock database is empty
const initializeSamples = () => {
  const data = loadData();
  
  if (data.users.length === 0) {
    // Add default admin and some students
    const bcrypt = require('bcryptjs');
    const adminPassword = bcrypt.hashSync('admin123', 8);
    const studentPassword = bcrypt.hashSync('student123', 8);
    
    data.users.push({
      _id: 'user_admin_001',
      name: 'Campus Admin',
      email: 'admin@campus.edu',
      passwordHash: adminPassword,
      role: 'admin',
      wishlist: [],
      createdAt: new Date().toISOString()
    });

    data.users.push({
      _id: 'user_student_001',
      name: 'Jane Doe',
      email: 'jane.doe2023@vitstudent.ac.in',
      passwordHash: studentPassword,
      role: 'student',
      wishlist: [],
      createdAt: new Date().toISOString()
    });

    data.users.push({
      _id: 'user_student_002',
      name: 'John Smith',
      email: 'john.smith@campus.edu',
      passwordHash: studentPassword,
      role: 'student',
      wishlist: [],
      createdAt: new Date().toISOString()
    });
  }

  if (data.products.length === 0) {
    data.products.push({
      _id: 'prod_001',
      name: 'Engineering Chemistry Textbook',
      description: 'Used for first year B.Tech, excellent condition with no markings.',
      category: '📚 Books',
      price: 250,
      condition: 'Good',
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'],
      pickupLocation: 'Library',
      seller: 'user_student_001',
      status: 'active',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
    });

    data.products.push({
      _id: 'prod_002',
      name: 'Scientific Calculator fx-991EX',
      description: 'Casio fx-991EX ClassWiz scientific calculator. Perfect for algebra and calculus.',
      category: '💻 Electronics',
      price: 800,
      condition: 'Like New',
      images: ['https://images.unsplash.com/photo-1574607383476-f517f220d398?auto=format&fit=crop&q=80&w=400'],
      pickupLocation: 'AB1',
      seller: 'user_student_001',
      status: 'active',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
    });

    data.products.push({
      _id: 'prod_003',
      name: 'Single Bed Wooden Study Table',
      description: 'Sturdy wooden table with drawers, ideal for hostel rooms.',
      category: '🪑 Furniture',
      price: 1200,
      condition: 'Fair',
      images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=400'],
      pickupLocation: 'Hostel Gate',
      seller: 'user_student_002',
      status: 'active',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
    });

    data.products.push({
      _id: 'prod_004',
      name: 'Decathlon Rockrider Bicycle',
      description: '18-speed gear mountain bike, needs minor brake tightening but drives perfectly.',
      category: '🚲 Cycles',
      price: 4500,
      condition: 'Good',
      images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=400'],
      pickupLocation: 'Food Court',
      seller: 'user_student_002',
      status: 'active',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString() // 2 days ago
    });
  }

  saveData(data);
};

// Run sample initialization
initializeSamples();

// Helper to generate a unique random ID
const generateId = (prefix) => `${prefix}_${Math.random().toString(36).substring(2, 11)}`;

// Mock Model Class
class MockModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  // Load and save wrappers
  _getCollection() {
    return loadData()[this.collectionName];
  }

  _saveCollection(collection) {
    const data = loadData();
    data[this.collectionName] = collection;
    saveData(data);
  }

  // Chainable populate tracker
  _initQuery(results) {
    return {
      results,
      populate: function (field) {
        const data = loadData();
        const refCollection = field === 'seller' ? 'users' : field === 'recipient' || field === 'sender' ? 'users' : null;
        if (!refCollection) return this;

        const populateItem = (item) => {
          if (!item) return item;
          const cloned = { ...item };
          const refId = cloned[field];
          if (typeof refId === 'string') {
            const refObj = data[refCollection].find(u => u._id === refId);
            if (refObj) {
              const { passwordHash, ...safeRefObj } = refObj;
              cloned[field] = safeRefObj;
            }
          }
          return cloned;
        };

        if (Array.isArray(this.results)) {
          this.results = this.results.map(populateItem);
        } else {
          this.results = populateItem(this.results);
        }
        return this;
      },
      sort: function (options) {
        if (!Array.isArray(this.results)) return this;
        const key = Object.keys(options)[0];
        const direction = options[key]; // 1 or -1, or 'desc' / 'asc'
        
        this.results.sort((a, b) => {
          let valA = a[key];
          let valB = b[key];
          
          if (valA instanceof Date || !isNaN(Date.parse(valA))) {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
          }

          if (valA < valB) return direction === -1 || direction === 'desc' ? 1 : -1;
          if (valA > valB) return direction === -1 || direction === 'desc' ? -1 : 1;
          return 0;
        });
        return this;
      },
      exec: function() {
        return this.results;
      },
      then: function (resolve) {
        resolve(this.results);
      }
    };
  }

  // Find operations
  find(filter = {}) {
    let list = this._getCollection();
    
    // Simple filter matching
    if (Object.keys(filter).length > 0) {
      list = list.filter(item => {
        for (const key in filter) {
          const filterVal = filter[key];
          
          // Support $or matching
          if (key === '$or' && Array.isArray(filterVal)) {
            const matchesOr = filterVal.some(condition => {
              for (const subKey in condition) {
                const subVal = condition[subKey];
                if (subVal && subVal.$regex) {
                  const regex = new RegExp(subVal.$regex, subVal.$options || 'i');
                  if (regex.test(item[subKey] || '')) return true;
                } else if (item[subKey] === subVal) {
                  return true;
                }
              }
              return false;
            });
            if (!matchesOr) return false;
            continue;
          }

          // Support regex matching
          if (filterVal && filterVal.$regex) {
            const regex = new RegExp(filterVal.$regex, filterVal.$options || 'i');
            if (!regex.test(item[key] || '')) return false;
            continue;
          }

          // Support comparison operators
          if (filterVal && typeof filterVal === 'object') {
            if (filterVal.$gte !== undefined && item[key] < filterVal.$gte) return false;
            if (filterVal.$lte !== undefined && item[key] > filterVal.$lte) return false;
            if (filterVal.$ne !== undefined && item[key] === filterVal.$ne) return false;
            if (filterVal.$in !== undefined && !filterVal.$in.includes(item[key])) return false;
            continue;
          }

          // Direct match
          if (item[key] !== filterVal) return false;
        }
        return true;
      });
    }

    return this._initQuery(list);
  }

  findOne(filter = {}) {
    const list = this._getCollection();
    const found = list.find(item => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
    return this._initQuery(found || null);
  }

  findById(id) {
    const list = this._getCollection();
    const found = list.find(item => item._id === id);
    return this._initQuery(found || null);
  }

  // Write operations
  async create(docData) {
    const list = this._getCollection();
    const newDoc = {
      _id: generateId(this.collectionName.substring(0, 4)),
      ...docData,
      createdAt: new Date().toISOString()
    };
    list.push(newDoc);
    this._saveCollection(list);
    return newDoc;
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    const list = this._getCollection();
    const idx = list.findIndex(item => item._id === id);
    if (idx === -1) return null;

    // Apply update (handle simple updates and Mongoose $addToSet / $pull)
    const original = list[idx];
    const updated = { ...original };

    if (updateData.$addToSet) {
      for (const key in updateData.$addToSet) {
        const val = updateData.$addToSet[key];
        if (!Array.isArray(updated[key])) updated[key] = [];
        if (!updated[key].includes(val)) updated[key].push(val);
      }
    } else if (updateData.$pull) {
      for (const key in updateData.$pull) {
        const val = updateData.$pull[key];
        if (Array.isArray(updated[key])) {
          updated[key] = updated[key].filter(v => v !== val);
        }
      }
    } else {
      // General merge
      Object.assign(updated, updateData);
    }

    list[idx] = updated;
    this._saveCollection(list);
    return options.new ? updated : original;
  }

  async findByIdAndDelete(id) {
    const list = this._getCollection();
    const idx = list.findIndex(item => item._id === id);
    if (idx === -1) return null;
    const deleted = list[idx];
    list.splice(idx, 1);
    this._saveCollection(list);
    return deleted;
  }

  async countDocuments(filter = {}) {
    const queryResult = this.find(filter);
    return queryResult.results.length;
  }
}

module.exports = {
  User: new MockModel('users'),
  Product: new MockModel('products'),
  Message: new MockModel('messages')
};
