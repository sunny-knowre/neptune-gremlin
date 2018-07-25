"use strict";
const contentDB = require("./content");
const Neptune = require("./neptune");
const ProgressBar = require('progress')
const paging_size = 300;

let _updatePropertiesPaged = async( traverser, data, count=0) => {
	let counter = 1;
	console.log()
	let bar = new ProgressBar('  updating :total vertices [:bar] :rate nodes/s :percent :etas', {
		complete: '=',
		incomplete: ' ',
		width: 40,
		total: count
	});
	for (const key in data) {
		if (data.hasOwnProperty(key)) {
			counter++;
			const row = data[key];
			traverser.updateVertex({
				id: row.id,
				properties: row.properties
			});
			if (counter > paging_size) {
				await traverser.commit();
				bar.tick(counter)
				counter = 1;
				traverser.reset();
			}
		}
	}
	await traverser.commit();
	bar.tick(counter)
	traverser.reset();
}

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
				traverser.reset();
			}
		}
	}
	await traverser.commit();
	bar.tick(counter)
	traverser.reset();
};

let _createEdgePaged = async (traverser, data) => {
	let counter = 1;
	let count = data.length
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

		traverser.createEdge(row)
		if (counter > paging_size) {
			await traverser.commit();
			bar.tick(counter)
			counter = 1;
			traverser.reset();
		}
	}
	await traverser.commit();
	bar.tick(counter)
	traverser.reset();
};

let _createEdgePagedByOut = async (traverser, data) => {
	let counter = 1;
	let count = data.length
	let lastTick = 0;
	console.log()
	let bar = new ProgressBar('  adding :total edges [:bar] :rate edges/s :percent :etas', {
		complete: '=',
		incomplete: ' ',
		width: 40,
		total: count
	});
	for (let i = 0; i < count; i++) {
		const edge = data[i];
		const row = {
			label: edge.label,
			outNode: edge.outNode,
			inNode: edge.inNode,
			properties: edge.properties
		}
		if(counter > 1 && data[i-1].outNode !== edge.outNode ){
			await traverser.commit();
			bar.tick(counter - lastTick)
			lastTick = counter
			traverser.reset();
		}
		counter++
		traverser.createEdge(row);
	}
	await traverser.commit();
	bar.tick(counter - lastTick)
	traverser.reset();
};

let testContentDB = async () => {
  const { count, data } = await contentDB.getTests(); 
  console.log('response from db')
  console.log(count)
};

let loadPatterns = async () => {
	let name = 'patterns'
	let { count, data, edges } = await contentDB.getPatterns();
	console.log("\n---Start Neptune Job for " + name + "---");
	const n = new Neptune('patterns');

	await _createVertexPaged(n, data, count);
	await _createEdgePagedByOut(n, edges);
};

let loadPatternRels = async () => {
	let name = 'patterns unit rels'
	let edges = await contentDB.getPatternUnitRel();
	console.log("\n---Start Neptune Job for " + name + "---");
	const n = new Neptune();
	
	await _createEdgePaged(n, edges);
};

let loadTests = async () => {
	const name = 'tests'
	const { count, data } = await contentDB.getTests();
	console.log("\n---Start Neptune Job for " + name + "---");
	const n = new Neptune('tests');
	let edges = []
	for (const key in data) {
		if (data.hasOwnProperty(key)) {
			const values = data[key].properties.datas;
			const testId = data[key].id
			values.forEach(d => {
				edges.push({
					label: "hasTestData",
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
	await _createEdgePaged(n, edges)
};

let loadUnits = async () => {
	const name = 'units'
	const { count, data } = await contentDB.getUnits();
	console.log("\n---Start Neptune Job for " + name + "---");

	const n = new Neptune('units');
	await _createVertexPaged(n, data, count);
};

let loadData = async () => {
	const name = 'datas'
	const { count, data, edges} = await contentDB.getData();
	console.log("\n---Start Neptune Job for " + name + "---");
	const n = new Neptune();
	
	await _createVertexPaged(n, data, count);
	await _createEdgePaged(n, edges);
};

let loadProblems = async () => {
	const name = 'problems'
	const { count, data, edges} = await contentDB.getProblems();
	console.log("\n---Start Neptune Job for " + name + "---");

	const n = new Neptune();
	// await _createVertexPaged(n, data, count);
	await _createEdgePaged(n, edges);	
}

let linkProblemSubsteps = async () => {
	const name = 'problem substeps'
	const { edges} = await contentDB.getSubProblemRels();
	console.log("\n---Start Neptune Job for " + name + "---");

	const n = new Neptune();
	await _createEdgePaged(n, edges);	
}

let updateProblemContents = async () => {
	let inc 	= 5000
	let counter = 160000
	let max 	= 380000
	while (counter < max){
		let start = counter+1
		let end = counter+inc
		const name = 'problem contents from id: ' + start + ' to ' + end
		const { count, data } = await contentDB.getProblemContents(start,end);
		
		console.log("\n---Start Neptune Job for " + name + "---");
		
		const n = new Neptune();
		await _updatePropertiesPaged(n, data, count);
			
		counter = end
	}
	
}

(async () => {
	let start = Date.now()
	// await loadUnits();
   // await loadData();
	// await loadPatterns()
	// await loadPatternRels()
	// await loadTests();
   await loadProblems()
	// await linkProblemSubsteps()
	//await updateProblemContents() -- last step skipped 180725
   //await testContentDB()

	let end = Date.now()
	let total = (end - start) / 1000
	console.log("total time", total+"s");
	contentDB.end();
})();
