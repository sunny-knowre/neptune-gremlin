"use strict";
const contentDB = require("./content");
const Neptune = require("./neptune");
const paging_size = 200;

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
	let { count, data, edges } = await contentDB.getPatterns();
	console.log("\npattern query done: " + count + " rows");
	const n = new Neptune('patterns');
	
	//await _createVertexPaged(n, data);
	//await _createEdgePagedByOut(n, edges);

	const children = await contentDB.getPatternUnitRel()
	await _createEdgePaged(n, children);
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
	const { count, data, edges} = await contentDB.getData();
	console.log("\ndata query done: " + count + " rows");
	const n = new Neptune('datas');
 	
	await _createVertexPaged(n, data);
	await _createEdgePaged(n, edges);
};
(async () => {
	console.time("total time");
	//await loadUnits();
	//await loadData();
	await loadPatterns()
	//await loadTests();

	console.log("\n");
	console.timeEnd("total time");
	contentDB.end();
})();
