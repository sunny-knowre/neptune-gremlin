"use strict";
const fs = require('fs')
const config = require("../secret");
const { structure, process } = require("gremlin-javascript");
const DriverRemoteConnection = require("../node_modules/gremlin-javascript/lib/driver/driver-remote-connection");

const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
const T = process.t;
const P = process.P;
const C = process.cardinality;
const __ = process.statics
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

	let lessonId = 'KR-LS-0000013358'
	let level = 'S_HIGH'
	traversal = g.V("KR-LS-0000003358")
				.outE('hasPattern').order().by(__.values('seq')).as('pseq').inV()
					.where(__.out('hasUnit').out().has('student_level'))
					.project("patterns").by(__.project("id","name","seq", "units")
						.by(__.id())
						.by(__.values('name'))
						.by(__.select('pseq').values('seq'))
						.by(__.outE().order().by(__.values('seq')).as('seq').inV().dedup().project("id","name","seq", "datas")
							.by(__.id())
							.by(__.values('name'))
							.by(__.select('seq').values('seq'))
							.by(__.out().has('student_level').id().fold())
							.fold())
						.fold())
					.fold()
	let label =  'sunnyTestEdge'
	let outNode =  'SUNNYTEST-0000374242'
	let inNode =  'KR-UN-0000004755'
	let properties =  null 
			
	let connectQuery = __.addE(label).from_(__.V(outNode)).to(__.V(inNode))
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
	traversal = g.V().hasLabel('SUNNYTEST').drop()

	let result = await traversal.next()
	result = result.value
	fs.writeFile('./output/queryOutput.json',JSON.stringify(result, null, 2), function(err) {
		if(err) console.log(err)
		else console.log('query output saved')
	})
	
	let total = (Date.now() - start)/1000
	console.log('query time: ' + total + 's')
	console.groupEnd(); 

})()