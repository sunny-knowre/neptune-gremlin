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
let getPatternUnitRel = () => {
	return new Promise((resolve, reject) => {
		const stmt =
			'SELECT		S.no id, P.no patternId, R.M_NO unitId, S.seq seq \
			FROM		TBC L INNER JOIN \
						TBC P on P.P_NO=L.NO INNER JOIN \
						TBC S on S.P_NO=P.NO INNER JOIN \
						TBC_RELATION R on R.S_NO=S.NO \
			WHERE 		S.lev=4 and R.type=2 \
			AND     	L.name not like "%보류%" \
			AND     	L.name not like "%삭제%" \
			AND     	P.name not like "%보류%" \
			AND     	P.name not like "%삭제%" \
			AND     	S.name not like "%보류%" \
			AND     	S.name not like "%삭제%" \
			AND 		R.M_NO is not null \
			GROUP BY   	P.NO,R.M_NO \
			ORDER BY	P.no, S.seq'

			pool.query(stmt, (error, results) => {
				if (error) reject(error);
				let edges = [];
				results.forEach(row => {
					edges.push({
						label: "hasUnit",
						inNode: "KR-UN-" + row.unitId.toString().padStart(10,"0"),
						outNode: "KR-PN-" + row.patternId.toString().padStart(10,"0"),
						properties: {
							seq: row.seq
						}
					})
				})
				resolve(edges);
			});
	});
};

let getPatterns = () => {
	return new Promise((resolve, reject) => {
		const stmt =
			'SELECT	P.no id, P.name name, L.no lessonId, P.seq seq \
			FROM		TBC P inner join \
						TBC L on P.p_no=L.no \
			WHERE		P.lev=3  \
			AND			P.name not like "%보류%" \
			AND			P.name not like "%삭제%" \
			AND			L.name not like "%보류%" \
			AND			L.name not like "%삭제%" \
			ORDER BY	P.p_no, P.seq'

		pool.query(stmt, (error, results) => {
			if (error) reject(error);
			let patterns = {};
			let edges = []
			let count = results.length;
			results.forEach(row => {
				let id = row.id + "";
				let prefix = "KR-PN-";
				id = prefix + id.padStart(10, "0");
				patterns[id] = {
					id,
					label: "Pattern",
					properties: {
						name: row.name
					}
				};
				edges.push({
					label: "hasPattern",
					inNode: id,
					outNode: "KR-LS-" + row.lessonId.toString().padStart(10,"0"),
					properties: {
						seq: row.seq
					}
				})
			});
			resolve({ count, data: patterns, edges });
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
			'SELECT	NO as id, M_NO as unit, af, af_s, VT as type, VS as value, df as difficulty, \
					gf_1, gf_2, gf_3, gf_4, \
					gf_s_1, gf_s_2, gf_s_3, gf_s_4 \
			FROM 	TBM_DATA where af>0 or af_s>0';

		pool.query(stmt, (error, results) => {
			if (error) reject(error);
			let data = {};
			let edges = []
			let count = results.length;
			results.forEach(row => {
				let student_level = []
				if(row.gf_1 > 0 ) student_level.push("HIGH")
				if(row.gf_2 > 0 ) student_level.push("MID")
				if(row.gf_3 > 0 ) student_level.push("LOW")
				if(row.gf_4 > 0 ) student_level.push("VLOW")
				if(row.gf_s_1 > 0 ) student_level.push("S_HIGH")
				if(row.gf_s_2 > 0 ) student_level.push("S_MID")
				if(row.gf_s_3 > 0 ) student_level.push("S_LOW")
				if(row.gf_s_4 > 0 ) student_level.push("S_VLOW")
				let id = row.id + "";
				let prefix = "KR-DA-";
				id = prefix + id.padStart(10, "0");
				data[id] = {
					id,
					label: "Data",
					properties: {
						af: row.af,
						af_s: row.af_s,
						difficulty: row.difficulty,
						type: row.type,
						value: row.value,
						student_level
					}
				};
				edges.push({
					label: "hasData",
					inNode: id,
					outNode: "KR-UN-" + row.unit.toString().padStart(10, "0"),
					properties: null
				})
			});
			resolve({ count, data, edges });
		});
	});
};

let getTests = () => {
	return new Promise((resolve, reject) => {
		const stmt = "SELECT * from tbc_batch where data_id in (select no from TBM_DATA)";
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

let getProblems = () => {
	return new Promise((resolve, reject) => {
      //unknown why that problem has to PMODULE	
		let stmt = 
		'SELECT	NO AS id, MODULE AS unit,PMODULE AS parent_unit, \
				DATA AS data_id, level, seq, sinod, pseq, af \
		FROM	TBQ \
		WHERE	( (af=1 and MODULE<999999 ) OR \
				NO in (173176,173177,173178,173179,173180,173181,173182,173183,173184,173185,173186, \
					173187,173188,173189, 173193,173194,173195,173192,173190,173191,173196,173197,173198, \
					155434, 155435, 155437, 155438, 155442, 155440, 155441, 155443, \
               155436, 155444, 155439, 155445 ) ) \
            AND NO<>376995 \
		ORDER BY DATA, LSEQ'
		pool.query(stmt, (error, results) => {
			if (error) reject(error);
			let problems = {};
			let edges = []
			let count = results.length
			results.forEach(row => {
				let id = row.id + "";
				let prefix = "KR-PB-";
				id = prefix + id.padStart(10, "0");
				problems[id] = {
					id,
					label: "Problem",
					properties: {
						level: row.level,
						seq: row.seq,
						pseq: row.pseq,
						sinod: row.sinod,
						af: row.af
					}
				};
				if(row.level === 1){
					edges.push({
						label: "makesProblem",
						inNode: id,
						outNode: "KR-DA-" + row.data_id.toString().padStart(10, "0"),
						properties: null
					})
				} else {
					edges.push({
						label: "callsUnit",
						outNode: id,
						inNode: "KR-UN-" + row.unit.toString().padStart(10, "0"),
						properties: null
					})
				}
			});
			resolve({ count, data:problems, edges });
		});
	});
};

let getSubProblemRels = () => {
	return new Promise((resolve, reject) => {
		const stmt = 
		'SELECT	R.id, R.parent, R.level, R.seq, R.pseq, R.af \
		FROM	(   SELECT  q.NO AS id, p.NO AS parent, q.level, q.seq, q.pseq, q.af \
							FROM TBQ q \
							INNER JOIN TBQ p ON (q.data=p.data AND q.pseq=p.seq) \
							WHERE q.LEVEL=2 AND p.LEVEL=1  AND q.af=1 AND p.af=1 GROUP BY q.no \
					UNION\
					SELECT  q.NO AS id, p.NO AS parent, q.level, q.seq, q.pseq, q.af \
							FROM TBQ q\
							INNER JOIN TBQ p ON (q.data=p.data AND q.pseq=p.seq) \
							WHERE q.LEVEL=3 AND p.LEVEL=2 AND q.af=1 AND p.af=1 GROUP BY q.no \
				) R \
		ORDER BY R.LEVEL'

		pool.query(stmt, (error, results) => {
			if (error) reject(error);
			let edges = []
			let count = results.length
			results.forEach(row => {
				let id = "KR-PB-" + row.id.toString().padStart(10, "0")
				let parent = "KR-PB-" + row.parent.toString().padStart(10, "0")
				edges.push({
						label: "hasSubstep",
						outNode: parent,
						inNode: id,
						properties: null
				})

			});
			resolve({ count, edges });
		});
	});
};

let getProblemContents = (start,end) => {
	return new Promise((resolve, reject) => {
		let stmt = 
		'SELECT	NO AS id, question, solution \
		FROM	TBQ \
		WHERE	af=1 and MODULE<999999 and NO between ? and ? \
		ORDER BY DATA, LSEQ'
		pool.query(stmt, [start, end],(error, results) => {
			if (error) reject(error);
			let problems = {};
			let count = results.length
			results.forEach(row => {
				let id = row.id + "";
				let prefix = "KR-PB-";
				id = prefix + id.padStart(10, "0");
				problems[id] = {
					id,
					properties: {
						question: row.question,
						solution: row.solution,
					}
				};
				
			});
			resolve({ count, data:problems });
		});
	});
};

module.exports = {
	end,
	getPatterns,
	getPatternUnitRel,
	getUnits,
	getData,
	getTests,
	getProblems,
	getSubProblemRels,
	getProblemContents
};
