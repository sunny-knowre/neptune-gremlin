"use strict";
const contentDB = require("./content");
const Neptune = require("./neptune");

let loadTests = async () => {
	const tests = await contentDB.getTests();
	const n = new Neptune();
	for (const key in tests) {
		if (tests.hasOwnProperty(key)) {
			const row = tests[key];
			let properties = {
				id: row.id,
				sub_id: row.sub_id,
				dky: row.dky,
				edp: row.edp,
				ebs: row.ebs,
				data: JSON.stringify(row.datas)
			};
			if (row.season) properties.season = row.season;
			if (row.chapter_id) properties.chapter_id = row.chapter_id;
			if (row.curriculum_id) properties.curriculum_id = row.curriculum_id;
			n.createVertex({
				label: row.label,
				properties
			});
		}
	}
	n.commit();
};

let loadUnits = async () => {
	const units = await contentDB.getUnits();
	console.log('sql query done');
	const n = new Neptune();
	let counter = 1
	for (const key in units) {
		if (units.hasOwnProperty(key)) {
			counter++
			const row = units[key];
			n.createVertex({
				id: row.id,
				label: row.label,
				properties: row.properties
			});
			if( counter > 4000 ){
				counter=1
				await n.commit()
				n.newTraversal()
			}
		}
	}
	await n.commit()
	n.reset()
};

(async () => {
	//await loadTests();
	await loadUnits();
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
