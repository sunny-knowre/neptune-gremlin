const { structure, process } = require("gremlin-javascript");
const DriverRemoteConnection = require("../node_modules/gremlin-javascript/lib/driver/driver-remote-connection");
const config = require("../secret");

const connection = new DriverRemoteConnection(config.neptune.endpoint);
//const __ = process.statics;
//const P = process.P;
const T = process.t;

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
              if(prop){
                let data = prop instanceof Array ? JSON.stringify(prop) : prop
                this.traversal.property(key,data)
              } 
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
          if(this.nodes > 0) console.log('nodes added:',this.nodes)
          if(this.edges > 0) console.log('edges added:',this.edges)
          console.log( 'query time: ', after - before, 'ms')
          resolve(result);
        })();
      } catch (err) {
        reject(err);
      }
    });
  }

  newTraversal () {
    this.traversal = null
  }

  reset() {
    this.traversal = null
    this.nodes = 0
    this.edges =0
    console.log('loading done')
  }
}

module.exports = Neptune
