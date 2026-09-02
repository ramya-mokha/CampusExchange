const db = require('../config/db');

const createModelProxy = (mockModelName, mongoModelPath) => {
  return new Proxy({}, {
    get(target, prop) {
      const activeModel = db.isUsingMock() 
        ? require('./mockDb')[mockModelName] 
        : require(mongoModelPath);
      const val = activeModel[prop];
      if (typeof val === 'function') {
        return val.bind(activeModel);
      }
      return val;
    }
  });
};

module.exports = {
  User: createModelProxy('User', './User'),
  Product: createModelProxy('Product', './Product'),
  Message: createModelProxy('Message', './Message')
};

