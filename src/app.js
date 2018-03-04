"use strict";
const contentDB = require("./content");
const Neptune = require("./neptune");
const paging_size = 1000;

let _createVertexPaged = async (traverser, data) => {
	let counter = 1;
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
				counter = 1;
				await traverser.commit();
				traverser.newTraversal();
			}
		}
	}
	await traverser.commit();
	traverser.reset();
};

let _createEdgePaged = async (traverser, data) => {
	let counter = 1;
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
			counter = 1;
			await traverser.commit();
			traverser.newTraversal();
		}
	}
	await traverser.commit();
	traverser.reset();
};

let loadPatterns = async () => {
	let { count, data } = await contentDB.getPatterns();
	console.log("\npattern query done: " + count + " rows");
	const n = new Neptune('patterns');
	let edges = []
	for (const key in data) {
		if (data.hasOwnProperty(key)) {
			const row = data[key];
			edges.push({
				label: "hasPattern",
				inNode: row.id,
				outNode: row.properties.lessonId,
				properties: {
					seq: row.properties.seq
				}
			});
		}
	}
	
	await _createVertexPaged(n, data);
	await _createEdgePaged(n, edges);

	const rels = await contentDB.getPatternUnitRel()
	data = rels.data
	let edges2 = []
	data.forEach(row => {
		edges2.push({
			label: "hasUnit",
			inNode: row.unit,
			outNode: row.pattern,
			properties: {
				seq: row.properties.seq
			}
		});
	})
	console.log(data[0])
	await _createEdgePaged(n, edges2);
};
let loadTests = async () => {
	const { count, data } = await contentDB.getTests();
	console.log("\ntests query done: " + count + " rows");
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

	await _createVertexPaged(n, data);
    await _createEdgePaged(n, edges)
};

let loadUnits = async () => {
	const { count, data } = await contentDB.getUnits();
	console.log("\nunit query done: " + count + " rows");
	const n = new Neptune('units');
	await _createVertexPaged(n, data);
};

let loadData = async () => {
	const { count, data } = await contentDB.getData();
	console.log("\ndata query done: " + count + " rows");
	const n = new Neptune('datas');
	let edges = [];
	for (const key in data) {
		if (data.hasOwnProperty(key)) {
			const row = data[key];
			edges.push({
				label: "hasData",
				inNode: row.id,
				outNode: "KR-UN-" + row.properties.unit.toString().padStart(10, "0"),
				properties: null
			});
		}
	}
	await _createVertexPaged(n, data);
	await _createEdgePaged(n, edges);
};
(async () => {
	console.time("total time");
	await loadPatterns()
	//await loadTests();
	//await loadUnits();
	//await loadData();

	console.log("\n");
	console.timeEnd("total time");
	contentDB.end();
})();
