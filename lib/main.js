'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/*
 * Utils method to interact with database cloud storage
 */

/*
 * Translates from Datastore's entity format to
 * the format expected by the application.
 *
 * Datastore format:
 *   {
 *     key: [kind, id],
 *     data: {
 *       property: value
 *     }
 *   }
 *
 * Application format:
 *   {
 *     id: id,
 *     property: value
 *   }
 */
const fromDatastore = exports.fromDatastore = obj => {
  obj.data.id = obj.key.id;
  return obj.data;
};

/*
 * Translates from the application's format to the datastore's
 * extended entity property format. It also handles marking any
 * specified properties as non-indexed. Does not translate the key.
 *
 * Application format:
 *   {
 *     id: id,
 *     property: value,
 *     unindexedProperty: value
 *   }
 *
 * Datastore extended format:
 *   [
 *     {
 *       name: property,
 *       value: value
 *     },
 *     {
 *       name: unindexedProperty,
 *       value: value,
 *       excludeFromIndexes: true
 *     }
 *   ]
 */
const toDatastore = exports.toDatastore = (obj, nonIndexed) => {
  nonIndexed = nonIndexed || [];
  const results = [];
  Object.keys(obj).forEach(k => {
    if (obj[k] === undefined) {
      return;
    }
    results.push({
      name: k,
      value: obj[k],
      excludeFromIndexes: nonIndexed.indexOf(k) !== -1
    });
  });
  return results;
};

/*
 * Get a specific kind isntance by id
 */
const read = exports.read = (_ref, id) => {
  let ds = _ref.ds;
  let kind = _ref.kind;
  return new Promise((resolve, reject) => {
    const key = ds.key([kind, parseInt(id, 10)]);
    ds.get(key, (err, entity) => {
      if (err) {
        return reject({
          status: err.status || 500,
          message: err.message
        });
      }
      if (!entity) {
        return reject({
          status: 404,
          message: 'Not found'
        });
      }
      return resolve(fromDatastore(entity));
    });
  });
};

/*
 * Get all kind instances
 */
const list = exports.list = _ref2 => {
  let ds = _ref2.ds;
  let kind = _ref2.kind;
  return new Promise((resolve, reject) => {
    const q = ds.createQuery([kind]);

    ds.runQuery(q, (err, entities) => {
      if (err) {
        return reject({
          status: err.status || 500,
          message: err.message
        });
      }
      return resolve(entities.map(fromDatastore));
    });
  });
};

/*
 * Update a kind instance if id is provided, or create a new one
 */
const update = exports.update = (_ref3, id, data) => {
  let ds = _ref3.ds;
  let kind = _ref3.kind;
  return new Promise((resolve, reject) => {
    let key;
    if (id) {
      key = ds.key([kind, parseInt(id, 10)]);
    } else {
      key = ds.key(kind);
    }

    const entity = {
      key: key,
      data: toDatastore(data)
    };

    ds.save(entity, err => {
      data.id = entity.key.id;
      return err ? reject({
        status: err.status || 500,
        message: err.message
      }) : resolve(data);
    });
  });
};

/*
 * Remvove a specific kind instance by id
 */
const remove = exports.remove = (_ref4, id) => {
  let ds = _ref4.ds;
  let kind = _ref4.kind;
  return new Promise((resolve, reject) => {
    const key = ds.key([kind, parseInt(id, 10)]);
    ds.delete(key, err => {
      if (err) {
        return reject({
          status: err.status || 500,
          message: err.message
        });
      }
      return resolve();
    });
  });
};