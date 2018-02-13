'use strict'

const config = require('../secret')
const { structure, process } = require('gremlin-javascript');
const DriverRemoteConnection = require('../node_modules/gremlin-javascript/lib/driver/driver-remote-connection');

const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
const __ = process.statics
const T  = process.t

const result = [];
try {
    (async () => { 
      const traversal = g.V().hasLabel('LevelTest')
                              .order().by(__.values('season'))
                              .order().by(__.values('sub_id'))
                              .project("id", "season", "sub_id")
                                .by(__.id())
                                .by(__.values('season'))
                                .by(__.values('sub_id'))
      result.push(await traversal.toList())
      console.log(result);
      
    })()
    
} catch (err) {
  console.log(err);
}    
 