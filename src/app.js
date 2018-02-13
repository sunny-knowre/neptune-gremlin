'use strict'

const config = require('../secret')
const { structure, process } = require('gremlin-javascript');
const DriverRemoteConnection = require('../node_modules/gremlin-javascript/lib/driver/driver-remote-connection');
const mysql= require('mysql');


const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
const __ = process.statics
const t = process.t
var db = mysql.createConnection({
  host     : config.mysql.host,
  user     : config.mysql.user,
  password : config.mysql.password,
  database : config.mysql.database
});


let tests = {}
db.connect();

db.query('SELECT * from tbc_batch', function (error, results, fields) {
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
  try {
    (async ()=>{
      for (const key in tests) {
        if (tests.hasOwnProperty(key) && key === 'KR-CT-0000014587-0') {
          const row = tests[key];
          const traversal = g.addV(row.label)
                                .property('id', row.id)
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

          await traversal.next()
        }
      }
    })()
  } catch (err) {
    console.log(err);
  }
 
});

db.end(); 

     

/*        const traversal = g.V().hasLabel('Chapter').valueMap(true)
       // const traversal = g.addV('ChapterTest::TestNode').property('id', 'TEST-123').property('name', 'test').property('datas', '123')
       // const traversal = g.V().hasLabel('Chapter').limit(1).valueMap(true);     
       // const traversal = g.V().hasLabel('TestNode').valueMap(true);
       // const traversal = g.V().hasLabel('TestNode').drop()
       const startTime = new Date().getTime();
       let result =  await traversal.toList()
       let count = await g.V().count().toList()
       let labels = await g.V().label().dedup().toList()
       const elapsed = new Date().getTime() - startTime
       console.log(result);
       console.log("query time: " + elapsed + " ms");
       console.log("total nodes: " + count);
       console.log("total labels: " + labels); */

