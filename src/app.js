'use strict'

const config = require('../secret')
const { structure, process } = require('gremlin-javascript');
const DriverRemoteConnection = require('../node_modules/gremlin-javascript/lib/driver/driver-remote-connection');

const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
const __ = process.statics
const t = process.t

try {
    (async () => { 
      const traversal = g.V().hasLabel('ChapterTest').limit(1).valueMap(true)
      // const traversal = g.addV('ChapterTest::TestNode').property('id', 'TEST-123').property('name', 'test').property('datas', '123')
      // const traversal = g.V().hasLabel('Chapter').limit(1).valueMap(true);     
      // const traversal = g.V().hasLabel('TestNode').valueMap(true);
      // const traversal = g.V().hasLabel('TestNode').drop()
      const startTime = new Date().getTime();
      let result =  await traversal.toList()
      let count = await g.V().count().toList()
      let labels = await g.V().label().dedup().toList()
      const elapsed = new Date().getTime() - startTime
      console.log(result);
      console.log("query time: " + elapsed + " ms");
      console.log("total nodes: " + count);
      console.log("total labels: " + labels);
    })()
    
} catch (err) {
  console.log(err);
}    
