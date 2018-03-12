"use strict";
const fs = require('fs')
const config = require("../secret");
const _ = require('lodash')
const { structure, process } = require("gremlin-javascript");
const DriverRemoteConnection = require("../node_modules/gremlin-javascript/lib/driver/driver-remote-connection");

const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
const T = process.t;
const P = process.P;
const C = process.cardinality;
const __ = process.statics
const Scope = process.scope

let traversal = null;

let getTutorial = async () => {
	const query = await g.V().hasLabel('Tutorial').values('problem_list').fold().next()
	let result = []
	query.value.forEach( row => {
		result = _.union(result, JSON.parse(row))
	})
	
	let final = []
	for (let row of result) {
		let id = "KR-PB-" + row.toString().padStart(10, "0");
		
		let traversal = await g.V(id).next()
		let found = traversal.value
		if(!found){
			console.log('not found', id)
		}else {
			console.log('found', id)
		}
	} 

	console.log(final)

	return

} 
(async () => {
	console.group('Test Output');
	let start = Date.now()
	//traversal = g.V().hasLabel('Unit').limit(1).valueMap(true)
	//traversal.V().has(T.label, P.within("Unit", "Test")).drop()
	//traversal = g.addV('Pattern').property(T.id,'KR-PN-0000000001')
	//traversal = g.V().hasLabel("Unit").outE('hasData').inV().limit(1).valueMap(true)
	//traversal = g.V().hasLabel("Data").where(__.inE().has("test123")).id()
	//traversal = g.V('KR-PN-0000000001').count()
	//traversal = g.V().hasLabel("Product").valueMap(true)
	//traversal = g.V().hasLabel("Data").limit(1).valueMap(true)
	//traversal = g.V().hasLabel("Product").outE('hasMap').inV().id()
	traversal = g.V().hasLabel("Product").project("name", "maps")
	.by(__.values("name"))
	.by(__.out('hasMap').has('curriculum_type', 'SEMESTER')
		.project("id","curriculum","type", "product_type","MapNodes")
			.by(__.id())
			.by(__.out('hasCurriculum').values('name'))
			.by(__.values('curriculum_type'))
			.by(__.values('product_type'))
			.by(__.outE('hasMapNode').order().by(__.values('seq')).as('seq').inV()
				.project("name", "composite_id","seq", "type","content_id", "extra")
					.by(__.values('name'))
					.by(__.values('composite_id'))
					.by(__.select('seq').values('seq'))
					.by(__.values('type'))
					.by(__.values('content_id'))
					.by(__.values('extra'))
				.fold())
			.fold()) 

	//let lessonId = await g.V().hasLabel('Lesson').id().next()
	//console.log(lessonId.value)
	//traversal = g.V(lessonId.value).addE('hasPatternTest').to(__.V().hasLabel('PatternTest')).property('seq', 1)

	traversal = g.V().hasLabel('Tutorial').values('problem_list').store('s').cap('s').order(Scope.local)
	
	try {
		let result = await traversal.next()
		console.log(result.value)
	} catch (err) {
		console.log(err);
	}
	
	

	/* fs.writeFile('./output/queryOutput.json',JSON.stringify(result, null, 2), function(err) {
		if(err) console.log(err)
		else console.log('query output saved')
	})
	*/
	let total = (Date.now() - start)/1000
	console.log('query time: ' + total + 's')
	console.groupEnd(); 

})()