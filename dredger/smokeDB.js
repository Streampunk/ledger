var config = {
    host: "ec2-34-250-142-104.eu-west-1.compute.amazonaws.com",
    port: 2424,
    httpPort: 2480,
    username: "root",
    password: "AMWALabs"
  },
    OrientDB = require('orientjs'),
    orientdb = OrientDB(config);
var Promise = require('bluebird');
var db = null;

function findOrCreateProperty(cls, property) {
  if (Array.isArray(property))
    return Promise.all(property.map(x => findOrCreateProperty(cls, x)))
      .then(x => x[0]);
  else return cls.property.list().then(l => {
    var prop = l.find(x => x.name === property.name);
    if (prop) {
      return prop;
    } else {
      return cls.property.create(property);
    }
  });
}

function createSubVertexType(name, supertype, properties) {
  return db.class.get(name)
    .then(x => { return x; }, err => { return db.class.create(name, supertype); })
    .then(x => { return findOrCreateProperty(x, properties); });
}

function createVertexType(name, properties) {
  return createSubVertexType(name, 'V', properties);
}

function createEdgeType(name) {
  return db.class.get(name)
    .then(x => x, err => db.class.create(name, 'E'));
}

function makeVertex(type, value) {
  return db.create('VERTEX', type).set(value).one();
}

function makeEdge(type, from, to, v = undefined) {
  if (from && to) {
    return v ? db.create('EDGE', type).from(from).to(to).set(v).one() :
      db.create('EDGE', type).from(from).to(to).one();
  }
  else return Promise.reject(new Error('Cannot make an edge when from or to do not exist.'))
}

var dbs = orientdb.list()
  .then(list => {
    var dredger = list.filter(x => x.name === 'dredger');
    if (dredger.length > 0) {
      return dredger[0];
    } else {
      return orientdb.create({
        name: 'dredger',
        type: 'graph',
        storage: 'plocal'
      });
    }
  })
  .then(dbr => {
    db = dbr;
    return createVertexType('Versionned', [{
      name: 'id',
      type: 'STRING',
      mandatory: true,
      notNull: true,
      regexp: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
    }, {
      name: 'version',
      type: 'STRING',
      mandatory: true,
      notNull: true,
      regexp: '[0-9]+:[0-9]+'
    }]);
  })
  .then(() => {
    return createSubVertexType('Node', 'Versionned', [{
      name: 'label',
      type: 'STRING'
    }, {
      name: 'href',
      type: 'STRING'
    }, {
      name: 'hostname',
      type: 'STRING'
    }, {
      name: 'caps',
      type: 'STRING'
    }])
  })
  .then(() => {
    return createSubVertexType('Device', 'Versionned', [{
      name: 'label',
      type: 'STRING'
    }, {
      name: 'type',
      type: 'STRING'
    }])
      .then(() => createEdgeType('DeviceNode'))
      .then(() => createEdgeType('DeviceSenders'))
      .then(() => createEdgeType('DeviceReceivers'));
  })
  .then(console.log)
  .error(console.error)
  .finally(() => { orientdb.close(); });
