'use strict'

const config = require('../secret')
const { structure, process } = require('gremlin-javascript');
const DriverRemoteConnection = require('../node_modules/gremlin-javascript/lib/driver/driver-remote-connection');

const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
const __ = process.statics

try {
    (async () => {
      const pr_id = 'KR-PR-0000000002';
    
    /*   const traversal = g.V().has('id',pr_id).as('pr').project("id", "name", "curriculums")
                       .by(__.id())
                       .by('name')
                       .by(__.out('has_curriculum').project("id", "seq")
                          .by(__.id())
                          .by(__.inE().values('seq')).fold()
                        )    */
      const traversal = g.V().hasLabel('Curriculum').valueMap(true, 'name')
      const startTime = new Date().getTime();
      let result =  await traversal.toList()
      const elapsed = new Date().getTime() - startTime
      console.log(result);
      console.log("query time: " + elapsed + " ms");
    })()
    
} catch (err) {
  console.log(err);
} 