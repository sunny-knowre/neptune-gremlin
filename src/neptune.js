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
					if(prop instanceof Array){
						prop.forEach( row => {
							let val = typeof row === "object" ? JSON.stringify(row) : row;
							this.traversal.property(key, val)
						})
					} else {
						this.traversal.property(key, prop);
					}
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
	updateVertex ({id, properties} ){
		if (!id) throw new Error("must give vertex id");
		if (!properties) throw new Error("must give properties to update")
		let keys = Object.keys(properties)

		if (!this.traversal) {
			this.traversal = this.g.V(id).sideEffect(__.properties(...keys).drop())
		} else {
			this.traversal.V(id).sideEffect(__.properties(...keys).drop())
		}
		for (const key in properties) {
			if (properties.hasOwnProperty(key)) {
				const prop = properties[key];
				if(prop instanceof Array){
					prop.forEach( row => {
						let val = typeof row === "object" ? JSON.stringify(row) : row;
						this.traversal.property(key, val)
					})
				} else {
					this.traversal.property(key, prop);
				}
			}
		}
		this.nodes++; 
	}

	findOrMakeVertex({ id, label, properties }) {
		if (!id) throw new Error("must give vertex id");
		if (!label) throw new Error("must give vertex label");
		let addQuery = __.addV(label).property(T.id, id)
		for (const key in properties) {
			if (properties.hasOwnProperty(key)) {
				const prop = properties[key];
				if (prop === null) {
					addQuery.property(key, "null");
				} else {
					if(prop instanceof Array){
						prop.forEach( row => {
							let val = typeof row === "object" ? JSON.stringify(row) : row;
							addQuery.property(key, val)
						})
					} else {
						addQuery.property(key, prop);
					}
				}
			}
		}
		if (!this.traversal) {
			this.traversal = this.g.V(id).fold().coalesce(__.unfold(),addQuery)
		} else {
			this.traversal.V(id).fold().coalesce(__.unfold(),addQuery)
		}
		
		this.nodes++;
	}

	findOrMakeEdge({ label, outNode, inNode, properties }) {
		if (!label) throw new Error("must give edge label");
		if (!outNode) throw new Error("must give out vertex id");
		if (!inNode) throw new Error("must give in vertex id");
		let connectQuery = __.addE(label).from_(__.V(outNode)).to(__.V(inNode))
		for (const key in properties) {
			if (properties.hasOwnProperty(key)) {
				const prop = properties[key];
				if (prop === null) {
					connectQuery.property(key, "null");
				} else {
					let data = prop instanceof Array ? JSON.stringify(prop) : prop;
					connectQuery.property(key, data);
				}
			}
		}
		if (!this.traversal) {
			this.traversal = this.g.V(inNode).inE(label).V(outNode).fold()
				.coalesce(__.unfold(), connectQuery)
		} else {
			this.traversal.V(inNode).inE(label).V(outNode).fold()
				.coalesce(__.unfold(), connectQuery)
		}
		
		this.edges++;
	}

	commit() {
		return new Promise((resolve, reject) => {
			if(this.traversal){
				try {
					(async () => {
						await this.traversal.next();
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
	}
}

module.exports = Neptune;
