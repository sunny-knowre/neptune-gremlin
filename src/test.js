"use strict";
const fs = require('fs')
const config = require("../secret");
const _ = require('lodash')
const { structure, process } = require("gremlin-javascript");
const DriverRemoteConnection = require("../node_modules/gremlin-javascript/lib/driver/driver-remote-connection");
const Neptune = require("./neptune");
const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
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
	let lessonId = 'KR-LS-0000052198'
	let level = 'S_MID'
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
/* 		let connectQuery = __.addE(label).from_(__.V(outNode)).to(__.V(inNode))
		for (const key in properties) {
			if (properties.hasOwnProperty(key)) {
				const prop = properties[key];
				if (prop === null) {
					connectQuery.property(key, "null");
				} else {
					let data = prop instanceof Array ? JSON.stringify(prop) : prop;
					connectQuery.property(key, data);
				}
			}
		}
		if (!this.traversal) {
			this.traversal = this.g.V(inNode).inE(label).V(outNode).fold()
				.coalesce(__.unfold(), connectQuery)
		} else {
			this.traversal.V(inNode).inE(label).V(outNode).fold()
				.coalesce(__.unfold(), connectQuery) */
	
	traversal = g.V().hasLabel('TESTSUNNY').drop()
	
	let result = await traversal.next().then( it =>  it.value );
	let total = (Date.now() - start)/1000
	console.log('query time: ' + total + 's')
	console.groupEnd();
	return result
})()
.then(result => {
	fs.writeFile('./output/queryOutput.json',JSON.stringify(result, null, 2), function(err) {
		if(err) console.log(err)
		else console.log('query output saved')
	})
})
.catch( e => console.log(e) )
