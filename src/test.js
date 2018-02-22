"use strict";

const config = require("../secret");
const { structure, process } = require("gremlin-javascript");
const DriverRemoteConnection = require("../node_modules/gremlin-javascript/lib/driver/driver-remote-connection");

const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
const T = process.t;
const P = process.P;
//const __ = process.statics

const result = [];
try {
	(async () => {
		//let traversal = g .V() .groupCount() .by(T.label);
		//const traversal = g.V().has(T.label, P.within("Unit", "Curriculum")).label().dedup()
		const traversal = g.V() .hasLabel("Unit").drop()
		result.push(await traversal.next());
		//traversal = g.E().groupCount().by(T.label);
		//result.push(await traversal.next());
		console.log(result);
	})();
} catch (err) {
	console.log(err);
}
