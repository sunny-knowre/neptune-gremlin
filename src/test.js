"use strict";

const config = require("../secret");
const { structure, process } = require("gremlin-javascript");
const DriverRemoteConnection = require("../node_modules/gremlin-javascript/lib/driver/driver-remote-connection");

const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
const T = process.t;
const P = process.P;
const __ = process.statics
let traversal = null
try {
	(async () => {
		console.group('Test Output');
		console.time('query time')
		//traversal.V().has(T.label, P.within("Unit", "Test")).drop()
		//traversal = g.V().hasLabel("Data").drop()
		traversal = g.V().hasLabel('Test').outE('hasData').drop()
		//traversal = g.E().hasLabel("hasData").drop()
		//traversal = g.V().hasLabel("Unit").drop()
		//traversal = g.V().hasLabel('Unit').limit(1).valueMap(true)
		//traversal = g.E().hasLabel("hasData").limit(1).valueMap(true)
		//traversal = g.V('KR-UN-0000004445').as('a').V('KR-DA-0000000050').as('b') 
		//traversal = g.V('KR-UN-0000004445').out('hasData')
		//traversal = g.V().hasLabel("Unit").limit(10).valueMap(true)
		//traversal = g.V('KR-CT-0000040396').valueMap(true)
		
		console.log(await traversal.toList())
		console.timeEnd('query time')
		console.groupEnd();
		
		
		console.group('Graph Summary')
		traversal = g.V().groupCount().by(T.label);
		console.log(await traversal.next());
		traversal = g.E().groupCount().by(T.label);
		console.log('edges', await traversal.next())		
		console.groupEnd()
	})();
} catch (err) {
	console.log(err);
}
