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
// db.connect();
 
// db.query('SELECT * from tbc_batch', function (error, results, fields) {
//   if (error) throw error;

//   results.forEach(row => {
//     let id = row.curriculum_id+""
//     let prefix = "KR-"
//     let label = "ChapterTest"
//     if(row.type === 1)
//       prefix = prefix + "CT-"
//     else if (row.type === 3)
//       {
//          label = "LevelTest"
//          prefix = prefix + "LT-"
//       }
//     else 
//       {
//          label = "DrillTest"
//          prefix = prefix + "DT-"
//       }

//    if(row.curriculum_id > 80000){
//        id = prefix + id.padStart(10,"0") + "-" + row.type_seq
//        if(tests.hasOwnProperty(id)){
//          tests[id].datas.push(row.data_id + "-" + row.seq)
//        }
//        else{
//          let rowId = row.id + ""
//          let curr_id = row.curriculum_id
//          if(curr_id > 100)
//             curr_id = curr_id - 100
//          tests[id] = {
//             id: id.slice(1,6) + rowId.padStart(10,"0"),
//             label: "Test::"+label,
//             curriculum: curr_id,
//             sub_id: row.type_seq,
//             datas: [row.data_id+ "-" + row.seq]
//          }
//        }
//     }
//   });
//   console.log(tests)
// });
 
// db.end(); 
try {
    (async () => {
      const pr_id = 'KR-PR-0000000002';
   
      const traversal = g.V().hasLabel('Chapter').valueMap(true)
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
      console.log("total labels: " + labels);
    })()
    
} catch (err) {
  console.log(err);
}    
