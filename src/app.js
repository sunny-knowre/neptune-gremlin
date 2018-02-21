"use strict";
const contentDB = require("./content");
const Neptune = require("./neptune");

let loadTests = async () => {
  const tests = await contentDB.getTests();

  console.log(tests);

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
  n.commit() 
};

loadTests();

/* db.query('SELECT * from tbc_batch', function (error, results, fields) {
  if (error) throw error;

  results.forEach(row => {
    let id = row.curriculum_id+""
    let prefix = "KR-"
    let label = "ChapterTest"
    if(row.type === 1) {
      prefix = prefix + "CT-"
   } else if (row.type === 3) {
      label = "LevelTest"
      prefix = prefix + "LT-"
   } else {
      label = "DrillTest"
      prefix = prefix + "DT-"
   }

   //start some processing 
   id = prefix + id.padStart(10,"0") + "-" + row.type_seq
   if(tests.hasOwnProperty(id)){
      tests[id].datas.push({data_id: row.data_id, seq: row.seq})
   } else {
         let rowId = row.id + ""
         let chap_id  = false
         let curr_id  = row.curriculum_id
         let season = 'VACATION'
         let dky = true
         let ebs = true
         let edp = true

         if(row.type < 3){
             chap_id  = row.curriculum_id
             curr_id  = false
         }

         if(curr_id > 100 && curr_id < 200){
            curr_id = curr_id - 100
            season = 'SEMESTER'
         }
         if(chap_id)
            season = false

         if(row.type===3) {
            if(row.type_seq === 1){
              ebs = false
            }else {
              edp = false
              dky = false
            }
         } 

         tests[id] = {
            id: id.slice(0,6) + rowId.padStart(10,"0"),
            label: "Test::" + label,
            season,
            curriculum_id: curr_id,
            chapter_id: chap_id, 
            sub_id: row.type_seq,
            dky,
            ebs,
            edp,
            datas: [{data_id: row.data_id, seq: row.seq}]
         }
       }
  });

  // start neptune traversal building
  try {
    (async ()=>{
      let count = 0
      let traversal = null
      for (const key in tests) {
        if (tests.hasOwnProperty(key)) {
          const row = tests[key];
          if(count < 1){
            //declare new traversal
            traversal = g.addV(row.label)
          } else {
            //dot chain for all the rest
            traversal.addV(row.label)
          }
          traversal.property(T.id, row.id)
                    .property('sub_id', row.sub_id)
                    .property('dky', row.dky)
                    .property('edp', row.edp)
                    .property('ebs', row.ebs)
                    .property('data', JSON.stringify(row.datas))
          if(row.season)
            traversal.property('season', row.season )
          if(row.chapter_id)
            traversal.property('chapter_id', row.chapter_id)
          if(row.curriculum_id)
            traversal.property('curriculum_id', row.curriculum_id)  
          count = count + 1;
          console.log('addv', row.id)
        }
      }
      //run one big query
      let result = await traversal.next()
      console.log(result)
    })()
  } catch (err) {
    console.log(err);
  }
 
});
 */
/* 
const before = Date.now();
db.query(
 'SELECT  A.id, (CASE WHEN C.bf=1 THEN "unit" ELSE "chain" END) AS bf, C.v_name as name, C.df AS difficulty, C.video AS video, C.video_ck AS video_ck, A.tier \
  FROM ( SELECT  module AS id, min(LEVEL) AS tier \
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
