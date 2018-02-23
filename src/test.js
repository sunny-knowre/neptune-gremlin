"use strict";

const config = require("../secret");
const { structure, process } = require("gremlin-javascript");
const DriverRemoteConnection = require("../node_modules/gremlin-javascript/lib/driver/driver-remote-connection");

const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
const T = process.t;
const P = process.P;
//const __ = process.statics
let traversal = null
try {
	(async () => {
		console.group('Test Output');
		traversal = g.V().constant('start')
		//traversal.V().has(T.label, P.within("Unit", "Test")).drop()
		traversal.V().hasLabel("Data").drop()
		//traversal = g.V().hasLabel("Map").has('productType', null).valueMap()
		//traversal.V().hasLabel("Data").valueMap(true)
		//traversal.V().hasLabel('Test').limit(1).valueMap(true)
		console.log(await traversal.next())
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
