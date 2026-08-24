const db = require('../config/db');

module.exports = {
  get User() {
    return db.isUsingMock() ? require('./mockDb').User : require('./User');
  },
  get Product() {
    return db.isUsingMock() ? require('./mockDb').Product : require('./Product');
  },
  get Message() {
    return db.isUsingMock() ? require('./mockDb').Message : require('./Message');
  }
};
