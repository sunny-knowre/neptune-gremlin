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
	34899, 51969, 51974, 51979, 51991, 51996, 52000, 52102, 52111, 52121, 52127, 52134, 52141, 52147, 52156, 52161, 52166, 52169, 52176, 52181, 52185, 52193, 52199, 52211, 52222, 52232, 53257, 53265, 53284, 53300, 53304 
	let lessonId = 'KR-LS-0000052198'
	let level = 'S_LOW'
	traversal = g.V(lessonId)
	.outE('hasPattern').order().by(__.values('seq')).as('pseq').inV()
		.where(__.out('hasUnit').out('hasData').has('student_level',level).count().is(P.gt(0)))
		.project("id","name","seq", "units" )
			.by(__.id())
			.by(__.values('name'))
			.by(__.select('pseq').values('seq'))
			.by(__.outE('hasUnit').order().by(__.values('seq')).as('seq').inV().dedup()
				.where(__.out().has('student_level',level).count().is(P.gt(0)))
				.project("id","name","seq", "datas")
					.by(__.id())
					.by(__.values('name'))
					.by(__.select('seq').values('seq'))
					.by(__.out().has('student_level',level).id()
				.fold())
			.fold())
		.fold()
		
	
	
	try {
		let result = await traversal.next()
		result = result.value
	
		fs.writeFile('./output/queryOutput.json',JSON.stringify(result, null, 2), function(err) {
			if(err) console.log(err)
			else console.log('query output saved')
		})
		
	} catch (err) {
		console.log(err);
	}
	
	

	
	let total = (Date.now() - start)/1000
	console.log('query time: ' + total + 's')
	console.groupEnd(); 

})()