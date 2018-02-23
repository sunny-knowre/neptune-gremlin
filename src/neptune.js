const { structure, process } = require("gremlin-javascript");
const DriverRemoteConnection = require("../node_modules/gremlin-javascript/lib/driver/driver-remote-connection");
const config = require("../secret");

const connection = new DriverRemoteConnection(config.neptune.endpoint);
const __ = process.statics;
const T = process.t;
//const P = process.P;

class Neptune {
	constructor() {
		this.g = new structure.Graph().traversal().withRemote(connection);
		this.traversal = null;
		this.nodes = 0;
		this.edges = 0;
		console.group();
		console.log("---Neptune Start---");
	}

	createVertex({ id, label, properties }) {
		if (!id) throw new Error("must give vertex id");
		if (!label) throw new Error("must give vertex label");

		if (!this.traversal) {
			this.traversal = this.g.addV(label).property(T.id, id);
		} else {
			this.traversal.addV(label).property(T.id, id);
		}
		for (const key in properties) {
			if (properties.hasOwnProperty(key)) {
				const prop = properties[key];
				if (prop === null) {
					this.traversal.property(key, "null");
				} else {
					let data = prop instanceof Array ? JSON.stringify(prop) : prop;
					this.traversal.property(key, data);
				}
			}
		}
		this.nodes++;
	}

	createEdge({ label, outNode, inNode, properties }) {
		if (!label) throw new Error("must give edge label");
		if (!outNode) throw new Error("must give out vertex id");
		if (!inNode) throw new Error("must give in vertex id");
		if (!this.traversal) {
			this.traversal = this.g.V(outNode).addE(label).to(__.V(inNode));
		} else {
			this.traversal.V(outNode).addE(label).to(__.V(inNode));
		}
		for (const key in properties) {
			if (properties.hasOwnProperty(key)) {
				const prop = properties[key];
				if (prop === null) {
					this.traversal.property(key, "null");
				} else {
					let data = prop instanceof Array ? JSON.stringify(prop) : prop;
					this.traversal.property(key, data);
				}
			}
		}
		this.edges++;
	}

	commit() {
		return new Promise((resolve, reject) => {
			if(this.traversal){
				try {
					(async () => {
						console.time("query time");
						let result = await this.traversal.next();
						console.timeEnd("query time");
						if (this.nodes > 0) console.log("nodes added:", this.nodes);
						if (this.edges > 0) console.log("edges added:", this.edges);
						resolve();
					})();
				} catch (err) {
					reject(err);
				}
			} else {
				resolve()
			}
		});
	}
	newTraversal() {
		this.traversal = null;
	}

	reset() {
		this.traversal = null;
		this.nodes = 0;
		this.edges = 0;
		console.log("---Neptune End---");
		console.groupEnd();
	}
}

module.exports = Neptune;
