var config = {
    host: "ec2-34-250-142-104.eu-west-1.compute.amazonaws.com",
    port: 2424,
    httpPort: 2480,
    username: "root",
    password: "AMWALabs"
  },
    OrientDB = require('orientjs'),
    orientdb = OrientDB(config);

var dbs = orientdb.list()
  .then(list => {
    console.log('Databases on Server:', list.map(x => x.name));
  })
  .finally(() => { orientdb.close(); });
