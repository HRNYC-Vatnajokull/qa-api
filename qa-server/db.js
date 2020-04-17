const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
  contactPoints: [process.env.DB_ADDRESS],
  localDataCenter: process.env.DB_DATA_CENTER || 'datacenter1',
});

client.connect();

module.exports = client;
