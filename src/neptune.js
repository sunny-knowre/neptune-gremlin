const { structure, process } = require("gremlin-javascript");
const DriverRemoteConnection = require("../node_modules/gremlin-javascript/lib/driver/driver-remote-connection");
const config = require("../secret");

const connection = new DriverRemoteConnection(config.neptune.endpoint);
const __ = process.statics;
const T = process.t;
const P = process.P;
let t = null;

class Neptune {
  constructor() {
    this.g = new structure.Graph().traversal().withRemote(connection);
    this.traversal = null
    this.nodes = 0
    this.edges = 0
  }

  createVertex({ id, label, properties }) {
      if(!id) throw new Error('must give vertex id')
      if(!this.traversal){
        this.traversal = this.g.addV(label).property(T.id, id)
      } else {
        this.traversal.addV(label).property(T.id, id)
      }
      for (const key in properties) {
          if (properties.hasOwnProperty(key)) {
              const prop = properties[key];
              if(prop)
                this.traversal.property(key,prop)
          }
      }
      this.nodes++
  }

  commit() {
    return new Promise((resolve, reject) => {
      try {
        (async () => {
          const before = Date.now(); 
          let result = await this.traversal.next();
          const after = Date.now();
          resolve(result);
          console.log('nodes added:',this.nodes)
          console.log('edges added:',this.edges)
          console.log( 'query time: ', after - before, 'ms')
          this.nodes = 0
          this.edges = 0
        })();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Neptune
