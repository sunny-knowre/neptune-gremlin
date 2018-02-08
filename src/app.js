'use strict'

const config = require('../secret')
const { structure, process } = require('gremlin-javascript');
const DriverRemoteConnection = require('../node_modules/gremlin-javascript/lib/driver/driver-remote-connection');
const mysql= require('mysql');

const connection = new DriverRemoteConnection(config.neptune.endpoint);
var g = new structure.Graph().traversal().withRemote(connection);
const __ = process.statics
var db = mysql.createConnection({
  host     : config.mysql.host,
  user     : config.mysql.user,
  password : config.mysql.password,
  database : config.mysql.database
});
 
/* db.connect();
 
db.query('SELECT * from tbc_batch limit 10', function (error, results, fields) {
  if (error) throw error;
  //console.log(fields);
  console.log(results.filter(row => row.type == 2));
});
 
db.end(); */
try {
    (async () => {
      const pr_id = 'KR-PR-0000000002';
    
/*        const traversal = g.V().has('id',pr_id).as('pr').project("id", "name", "curriculums")
                       .by(__.id())
                       .by('name')
                       .by(__.out('has_curriculum').project("id", "seq")
                          .by(__.id())
                          .by(__.inE().values('seq')).fold()
                        )     */
      const traversal = g.V().label().dedup()
      const startTime = new Date().getTime();
      let result =  await traversal.toList()
      const elapsed = new Date().getTime() - startTime
      console.log(result);
      console.log("query time: " + elapsed + " ms");
    })()
    
} catch (err) {
  console.log(err);
}  