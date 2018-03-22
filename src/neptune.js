const { structure, process } = require("gremlin-javascript");
const DriverRemoteConnection = require("../node_modules/gremlin-javascript/lib/driver/driver-remote-connection");
const config = require("../secret");

const connection = new DriverRemoteConnection(config.neptune.endpoint);
const __ = process.statics;
const T = process.t;
const P = process.P

class Neptune {
	constructor() {
		this.g = new structure.Graph().traversal().withRemote(connection);
		this.traversal = null;
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
			this.traversal.coalesce(__.V(id), addQuery)
		}
	}

	findOrMakeEdge({ label, outNode, inNode, properties }) {
		if (!label) throw new Error("must give edge label");
		if (!outNode) throw new Error("must give out vertex id");
		if (!inNode) throw new Error("must give in vertex id");
		let connectQuery = __.addE(label).from_("a")
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
			this.traversal = this.g.V(outNode).as("a").V(inNode)
								.coalesce(__.inE(label).where(__.outV().as("a")), connectQuery)
		} else {
			this.traversal.V(outNode).as("a").V(inNode)
							.coalesce(__.inE(label).where(__.outV().as("a")), connectQuery)
		}
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

	reset() {
		this.traversal = null;
	}
}

module.exports = Neptune;
