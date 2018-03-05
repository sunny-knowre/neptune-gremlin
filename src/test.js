"use strict";
const fs = require('fs')
const config = require("../secret");
const { structure, process } = require("gremlin-javascript");
const DriverRemoteConnection = require("../node_modules/gremlin-javascript/lib/driver/driver-remote-connection");

const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
const T = process.t;
const P = process.P;
const __ = process.statics;
const asdf = process.pop;
let traversal = null

let stats = async () => {
	let vProps = await g.V().group().by(T.label).by(__.properties().key().dedup().fold()).next()
		let eProps = await g.E().group().by(T.label).by(__.properties().key().dedup().fold()).next()
		let v = await g.V().groupCount().by(T.label).next()
		let e = await g.E().groupCount().by(T.label).next()
		
		let stats = {
			vertexCount: v.value,
			edgeCount: e.value,
			vertexProps: vProps.value,
			edgeProps: eProps.value
		}
		let result = JSON.stringify(stats,null,2)
		fs.writeFile('./output/stats.json', result, function(err) {
			if(err) console.log(err)
			else console.log('stats saved')
		})
}

let test = async () => {
	console.group('Test Output');
	console.time('query time')
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
	traversal = g.V(lessonId).outE('hasPattern').order().by(__.values('seq')).inV()
					.where(__.out('hasUnit').out().has('student_level',level))
					.project("patterns").by(__.project("id","name", "units")
						.by(__.id())
						.by(__.values('name'))
						.by(__.outE().order().by(__.values('seq')).inV().dedup().project("id","name", "datas")
							.by(__.id())
							.by(__.values('name'))
							.by(__.out().has('student_level', level).id().fold())
							.fold())
						.fold())
					.fold()

	
	let data = await traversal.next()
	let result = data.value

	result.forEach(el => {
		el.patterns.forEach( unit => {
			unit.units = unit.units.filter( row => {
				return row.datas.length > 0
			})
		})
	}); 

	fs.writeFile('./output/queryOutput.json',JSON.stringify(result, null, 2), function(err) {
		if(err) console.log(err)
		else console.log('query output saved')
	})
	console.timeEnd('query time')
	console.groupEnd(); 
}

(async ()=> {
	await test()
	//await stats()
})()