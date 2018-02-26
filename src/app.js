"use strict";
const contentDB = require("./content");
const Neptune = require("./neptune");
const paging_size = 500;

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
	//await loadTests();
	//await loadUnits();
	//await loadData();

	console.log("\n");
	console.timeEnd("total time");
	contentDB.end();
})();

//contentDB.end()
/* 
const before = Date.now();
db.query(
 'SELECT  A.id, (CASE WHEN C.bf=1 THEN "unit" ELSE "chain" END) AS bf, C.v_name as name, C.df AS difficulty, C.video AS video, C.video_ck AS video_ck, A.tier \
  FROM (SELECT  module AS id, min(LEVEL) AS tier \
		FROM TBQ \
		GROUP BY module \
		) A INNER JOIN \
  TBM C ON A.id = C.no \
  GROUP BY A.id limit 10', function (error, results, fields) {
  if (error) throw error;
  const after = Date.now();
	
  results.forEach(row => {
	let id = row.id+""
	let prefix = "KR-UN-"
	let label = "Unit"
	id = prefix + id.padStart(10,"0")
	console.log(id) 
  })
  const totalTime = (after - before)
  console.log(totalTime, 'seconds');
});  */

/* db.query(
  'SELECT NO AS id, M_NO AS unit, af, af_s, VT AS TYPE, VS AS VALUE, df AS difficulty FROM TBM_DATA limit 1', 
  function (error, results, fields) {
   if (error) throw error;
	 
   results.forEach(row => {
	 console.log(row['unit']) 
   })
 });    
 */
