"use strict";
const fs = require('fs')
const config = require("../secret");
const { structure, process } = require("gremlin-javascript");
const DriverRemoteConnection = require("../node_modules/gremlin-javascript/lib/driver/driver-remote-connection");

const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
const T = process.t;

(async () => {
		//let vProps = await g.V().group().by(T.label).by(__.properties().key().dedup().fold()).next()
		//let eProps = await g.E().group().by(T.label).by(__.properties().key().dedup().fold()).next()
		let v = await g.V().groupCount().by(T.label).next()
		let e = await g.E().groupCount().by(T.label).next()
		
		let stats = {
			vertexCount: v.value,
			edgeCount: e.value,
		//	vertexProps: vProps.value,
		//	edgeProps: eProps.value
		}
		let result = JSON.stringify(stats,null,2)
		fs.writeFile('./output/stats.json', result, function(err) {
			if(err) console.log(err)
			else console.log('stats saved')
		})
})()