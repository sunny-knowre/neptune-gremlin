"use strict";
const contentDB = require("./content");
const Neptune = require("./neptune");
const paging_size = 500;
const ProgressBar = require('progress')

let _createVertexPaged = async (traverser, data, count=0) => {
	let counter = 1;
	console.log()
	let bar = new ProgressBar('  adding :total vertices [:bar] :rate nodes/s :percent :etas', {
		complete: '=',
		incomplete: ' ',
		width: 40,
		total: count
	});
	for (const key in data) {
		if (data.hasOwnProperty(key)) {
			counter++;
			const row = data[key];
			traverser.createVertex({
				id: row.id,
				label: row.label,
				properties: row.properties
			});
			if (counter > paging_size) {
				await traverser.commit();
				bar.tick(counter)
				counter = 1;
				traverser.newTraversal();
			}
		}
	}
	await traverser.commit();
	traverser.reset();
};

let _createEdgePaged = async (traverser, data, count=0) => {
	let counter = 1;
	console.log()
	let bar = new ProgressBar('  adding :total edges [:bar] :rate edges/s :percent :etas', {
		complete: '=',
		incomplete: ' ',
		width: 40,
		total: count
	});
	for (const edge of data) {
		counter++;
		let row = {
			label: edge.label,
			outNode: edge.outNode,
			inNode: edge.inNode,
			properties: edge.properties
		}

		traverser.createEdge(row);
		if (counter > paging_size) {
			await traverser.commit();
			bar.tick(counter)
			counter = 1;
			traverser.newTraversal();
		}
	}
	await traverser.commit();
	traverser.reset();
};
//needs progress refac
let _createEdgePagedByOut = async (traverser, data) => {
	let counter = 1;
	for (let i = 0; i < data.length; i++) {
		const edge = data[i];
		const row = {
			label: edge.label,
			outNode: edge.outNode,
			inNode: edge.inNode,
			properties: edge.properties
		}
		if(counter > 1 && data[i-1].outNode !== edge.outNode ){
			await traverser.commit();
			traverser.newTraversal();
		}
		counter++
		traverser.createEdge(row);
	}
	await traverser.commit();
	traverser.reset();
};


let loadPatterns = async () => {
	let name = 'patterns'
	//needs count refac
	let { count, data, edges } = await contentDB.getPatterns();
	console.group();
	console.log("---Start Neptune Job for " + name + "---");
	const n = new Neptune('patterns');

	await _createVertexPaged(n, data, count.vertices);
	await _createEdgePagedByOut(n, edges, count.edges);
	//needs count refac
	const children = await contentDB.getPatternUnitRel()
	console.log('adding pattern data rels')
	await _createEdgePaged(n, children, children.length);
	console.log("---End Neptune Job for " + name + "---");
	console.groupEnd()
};

let loadTests = async () => {
	const name = 'tests'
	const { count, data } = await contentDB.getTests();
	console.group();
	console.log("---Start Neptune Job for " + name + "---");
	const n = new Neptune('tests');
	let edges = []
	for (const key in data) {
		if (data.hasOwnProperty(key)) {
			const values = data[key].properties.datas;
			const testId = data[key].id
			values.forEach(d => {
				edges.push({
					label: "hasData",
					inNode: "KR-DA-" + d.data_id.toString().padStart(10,"0"),
					outNode: testId,
					properties: {
						seq: d.seq
					}
				})
			});
		}
	}

	await _createVertexPaged(n, data, count);
	await _createEdgePaged(n, edges, edges.length)
	console.log("---End Neptune Job for " + name + "---");
	console.groupEnd()
};

let loadUnits = async () => {
	const name = 'units'
	const { count, data } = await contentDB.getUnits();
	console.group();
	console.log("---Start Neptune Job for " + name + "---");
	const n = new Neptune('units');
	await _createVertexPaged(n, data, count);
	console.log("---End Neptune Job for " + name + "---");
	console.groupEnd()
};

//needs content refac
let loadData = async () => {
	const name = 'datas'
	const { count, data, edges} = await contentDB.getData();
	console.group();
	console.log("---Start Neptune Job for " + name + "---");
	const n = new Neptune();
	
	await _createVertexPaged(n, data, count.vertices);
	await _createEdgePaged(n, edges, count.edges);

	console.log("---End Neptune Job for " + name + "---");
	console.groupEnd()
};

let loadProblems = async () => {
	const name = 'problems'
	const { count, data, edges} = await contentDB.getProblems();
	console.group();
	console.log("---Start Neptune Job for " + name + "---");

	const n = new Neptune();
	await _createVertexPaged(n, data, count.vertices);
	await _createEdgePaged(n, edges, count.edges);
	
	console.log("---End Neptune Job for " + name + "---");
	console.groupEnd()
}
(async () => {
	let start = Date.now()
	console.group('App')
	//await loadUnits();
	//await loadData();
	//await loadPatterns()
	//await loadTests();
	await loadProblems()

	let end = Date.now()
	let total = (end - start) / 1000
	console.log("total time", total+"s");
	console.groupEnd()
	contentDB.end();
})();
