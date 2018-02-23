"use strict";

const mysql = require("mysql");
const config = require("../secret");

var pool = mysql.createPool({
	connectionLimit: 10,
	host: config.mysql.host,
	user: config.mysql.user,
	password: config.mysql.password,
	database: config.mysql.database
});

let end = () => {
	pool.end();
};

let getTests = () => {
	return new Promise((resolve, reject) => {
		const stmt = "SELECT * from tbc_batch";
		pool.query(stmt, (error, results) => {
			if (error) reject(error);
			let tests = {};
			let count = results.length;
			results.forEach(row => {
				let id = row.curriculum_id + "";
				let prefix = "KR-";
				let label = "ChapterTest";
				if (row.type === 1) {
					prefix = prefix + "CT-";
				} else if (row.type === 3) {
					label = "LevelTest";
					prefix = prefix + "LT-";
				} else {
					label = "DrillTest";
					prefix = prefix + "DT-";
				}

				//group tests by id curriculum and type_seq
				id = prefix + id.padStart(10, "0") + "-" + row.type_seq;
				if (tests.hasOwnProperty(id)) {
					tests[id].properties.datas.push({
						data_id: row.data_id,
						seq: row.seq
					});
				} else {
					let rowId = row.id + "";
					let chap_id = false;
					let curr_id = row.curriculum_id;
					let season = "VACATION";
					let dky = true;
					let ebs = true;
					let edp = true;
					// handle chapter link cases
					if (row.type < 3) {
						chap_id = row.curriculum_id;
						curr_id = false;
					}

					// only have season for curriculum links
					if (chap_id) season = false;

					// get rid of semester/vacation numbering difference
					if (curr_id > 100 && curr_id < 200) {
						curr_id = curr_id - 100;
						season = "SEMESTER";
					}

					// deal with product differences
					if (row.type === 3) {
						if (row.type_seq === 1) {
							ebs = false;
						} else {
							edp = false;
							dky = false;
						}
					}

					// build final tests list get rid of subtype in UID for final list items
					tests[id] = {
						id: id.slice(0, 6) + rowId.padStart(10, "0"),
						label: "Test::" + label,
						properties: {
							season,
							curriculum_id: curr_id,
							chapter_id: chap_id,
							sub_id: row.type_seq,
							dky,
							ebs,
							edp,
							datas: [{ data_id: row.data_id, seq: row.seq }]
						}
					};
				}
			});
			resolve({ count, data: tests });
		});
	});
};

let getUnits = () => {
	return new Promise((resolve, reject) => {
		const stmt =
			'SELECT	C.no as id, (CASE WHEN C.bf=1 THEN "unit" ELSE "chain" END) AS bf, \
					C.v_name as name, C.df AS difficulty, C.video AS video, C.video_ck AS video_ck \
			FROM	TBM C'

		pool.query(stmt, (error, results) => {
			if (error) reject(error);
			let units = {};
			let count = results.length;
			results.forEach(row => {
				let id = row.id + "";
				let prefix = "KR-UN-";
				id = prefix + id.padStart(10, "0");
				units[id] = {
					id,
					label: "Unit",
					properties: {
						chain: row.bf,
						name: row.name,
						difficulty: row.difficulty,
						video: row.video,
						video_ck: row.video_ck
					}
				};
			});
			resolve({ count, data: units });
		});
	});
};

let getData = () => {
	return new Promise((resolve, reject) => {
		const stmt =
			"SELECT NO as id, M_NO as unit, af, af_s, VT as type, VS as value, df as difficulty \
			FROM TBM_DATA where af=1 or af_s=1";

		pool.query(stmt, (error, results) => {
			if (error) reject(error);
			let data = {};
			let count = results.length;
			results.forEach(row => {
				let id = row.id + "";
				let prefix = "KR-DA-";
				id = prefix + id.padStart(10, "0");
				data[id] = {
					id,
					label: "Data",
					properties: {
						unit: row.unit,
						af: row.af,
						af_s: row.af_s,
						difficulty: row.difficulty,
						type: row.type,
						value: row.value
					}
				};
			});
			resolve({ count, data: data });
		});
	});
};

module.exports = {
	end,
	getTests,
	getUnits,
	getData
};
