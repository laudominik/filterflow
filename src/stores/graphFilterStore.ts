import {Engine, ExternalEngineResponse} from "../engine/engine"
import {ConnectionDefinition, ConnectionInfo, GUID, IConnectionStore} from "./storeInterfaces";
import {PreviewStores} from "./previewStore";
import {AnyT, TypedJSON, jsonArrayMember, jsonMember, jsonObject} from "typedjson";
import Transform from "../engine/Transform";
import {IEngine} from "../engine/iengine"
import {knownTypes} from "../engine/TransformDeclarations";

@jsonObject
export abstract class GraphFilterStore extends PreviewStores implements IConnectionStore {

    connectionsListener: CallableFunction[]
    @jsonArrayMember(AnyT)
    connections: ConnectionInfo[]

    constructor() {
        super(new Engine());
        this.connectionsListener = [];
        this.connections = [];
        this._bindToEngine();
    }

    protected _bindToEngine() {
        this.engine.addEventListener("update", this.handleEngineInfo.bind(this) as any)
    }

    abstract _handleEngineInfo(event: ExternalEngineResponse): void;

    private handleEngineInfo(event: CustomEvent<ExternalEngineResponse>) {
        let body = event.detail;

        if (body.node.added.length || body.node.removed.length) {
            this.nodeCollection = this.nodeCollection.filter(v => !body.node.removed.includes(v));
            this.nodeCollection = [...this.nodeCollection, ...body.node.added];
        }


        if (body.connection.added.length || body.connection.removed.length) {
            this.connections = this.connections.filter(v => !body.connection.removed.reduce((p, c) => p || c.toString() == v.connectionDefinition.toString(), false))

            const uniqueNewConnections = body.connection.added.filter(v => !this.connections.reduce((p, c) =>
                p || v.toString() === c.connectionDefinition.toString(), false))

            this.connections = [...this.connections, ...uniqueNewConnections.map<ConnectionInfo>(v => {return {connectionDefinition: v};})]
        }

        this._handleEngineInfo(body);


        this.connectionsListener.forEach(v => v());
        this.nodeListeners.forEach(v => v.listener()); // TODO tmp update
        this.nodeCollectionListener.forEach(v => v());
    }

    //#region Connections

    public getConnections() {
        return this.connections;
    }

    public forceConnectionsRefresh() {
        this.connections = [...this.connections]
        this.emitChangeConnections()
    }

    public subscribeConnections(listener: CallableFunction) {
        this.connectionsListener = [...this.connectionsListener, listener]
        return () => {
            this.connectionsListener = this.connectionsListener.filter(l => l != listener);
        };
    }

    public emitChangeConnections() {
        this.connectionsListener.forEach((v) => v())
    }

    //#region Vertices
    public disconnectNodes(connection: ConnectionDefinition) {
        const [[source, source_handle], [destination, destination_handle]] = connection;
        if (this.engine.disconnectNodes(source, destination, source_handle, destination_handle)) {
            this.connections = this.connections.filter((info) => !(
                info.connectionDefinition[0][0] === connection[0][0] &&
                info.connectionDefinition[1][0] === connection[1][0] &&
                info.connectionDefinition[0][1] === connection[0][1] &&
                info.connectionDefinition[1][1] === connection[1][1]
            ))
            this.emitChangeConnections();
        }
        // Store state only update Nodes, connection is between nodes
    }
    public connectNodes(connection: ConnectionDefinition) {
        const [[source, source_handle], [destination, destination_handle]] = connection;
        if (this.engine.connectNodes(source, destination, source_handle, destination_handle)) {
            // this.connections = [...this.connections,{connectionDefinition:connection}];
            // this.emitChangeConnections();
        }
        // Store state only update Nodes, connection is between nodes
    }

    public removeTransform(id: GUID) {
        this.connections = this.connections.filter((info) =>
            info.connectionDefinition[0][0] != id && info.connectionDefinition[1][0] != id
        )
        this.engine.removeNode(id);
    }
    //#endregion
}
