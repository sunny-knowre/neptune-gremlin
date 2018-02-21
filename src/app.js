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
      const traversal = g.V('KR-LT-0000016785').as('lt')
                         .V('KR-CU-0000000005').as('cu')
                         .addE('test_edge').from_('lt').to('cu')                      
      result.push(await traversal.toList())
      console.log(result);
      
    })()
    
} catch (err) {
  console.log(err);
}    
 