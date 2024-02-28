import { Engine, ExternalEngineResponse } from "../engine/engine"
import { ConnectionDefinition, ConnectionInfo } from "./storeInterfaces";
import { PreviewStores } from "./previewStore";





export class GraphFilterStore extends PreviewStores{
    connectionsListener: CallableFunction[]
    connections: ConnectionInfo[]

    constructor() {
        super("graph",new Engine());
        this.connectionsListener = [];
        this.connections = [];

        this.engine.addEventListener("update",this.handleEngineInfo as any)
    }

    private handleEngineInfo(event:CustomEvent<ExternalEngineResponse>){
        let body = event.detail;

        this.connections.filter( v => body.connection.removed.reduce((p,c) => p || c==v.connectionDefinition,false))
        this.connections.push(...body.connection.added.map<ConnectionInfo>(v =>{return {connectionDefinition: v,display: [[0,0],[0,0]]};}))
        this.connectionsListener.forEach(v => v());
        this.nodeListeners.forEach(v => v.listener()); // TODO tmp update
    }

    //#region Connections

    public getConnections(){
        return this.connections;
    }

    public subscribeConnections(listener: CallableFunction) {
        this.connectionsListener = [...this.connectionsListener, listener]
        return () => {
            this.connectionsListener = this.connectionsListener.filter(l => l != listener);
        };
    }

    public emitChangeConnections(){
        this.connectionsListener.forEach((v) => v())
    }

    //#region Vertices
    public disconnectNodes(connection: ConnectionDefinition){
        // const [[source,source_handle],[destination,destination_handle]] = connection;
        // if (this.engine.disconnectNodes(source,destination,source_handle,destination_handle)){
        //     this.connections = this.connections.filter((info) => !(
        //         info.connectionDefinition[0][0] === connection[0][0] && 
        //         info.connectionDefinition[1][0] === connection[1][0] &&
        //         info.connectionDefinition[0][1] === connection[0][1] && 
        //         info.connectionDefinition[1][1] === connection[1][1] 
        //     ))
        //     this.emitChangeConnections();
        // }
        const [[source,source_handle],[destination,destination_handle]] = connection;
        this.connections = this.connections.filter((info) => !(
            info.connectionDefinition[0][0] === connection[0][0] && 
            info.connectionDefinition[1][0] === connection[1][0] &&
            info.connectionDefinition[0][1] === connection[0][1] && 
            info.connectionDefinition[1][1] === connection[1][1] 
        ))
        this.emitChangeConnections();
        // Store state only update Nodes, connection is between nodes
    }
    public connectNodes(connection: ConnectionDefinition){
        // const [[source,source_handle],[destination,destination_handle]] = connection;
        // if (this.engine.connectNodes(source,destination,source_handle,destination_handle)){
        //     this.connections = [...this.connections,{connectionDefinition:connection,display:[[0,0],[0,0]]}];
        //     this.emitChangeConnections();
        // }
        this.connections = [...this.connections,{connectionDefinition:connection,display:[[0,0],[0,0]]}];
        this.emitChangeConnections();
        // Store state only update Nodes, connection is between nodes
    }
    //#endregion
    
    //#endregion
    
    //#region Persistence
    public saveAs(name: string): void {
        // TODO 
    }
    public load(name: string): void {
        // TODO 
    }
    //#endregion
}
