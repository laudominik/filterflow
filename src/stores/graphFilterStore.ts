import { createContext } from "react";
import Transform, { KVParams } from "../engine/Transform"
import { Engine, GUID, ExternalEngineResponse } from "../engine/engine"
import { BaseFilterStore } from "./baseFilterStore";
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
        const [[source,source_handle],[destination,destination_handle]] = connection;
        if (this.engine.disconnectNodes(source,destination,source_handle,destination_handle)){
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
    public connectNodes(connection: ConnectionDefinition){
        const [[source,source_handle],[destination,destination_handle]] = connection;
        // if (this.engine.connectNodes(source,destination,source_handle,destination_handle)){
        //     this.connections = [...this.connections,{connectionDefinition:connection,display:[[0,0],[0,0]]}];
        //     this.emitChangeConnections();
        // }

        // TODO: fix this (this.engine.connectNodes throws exception)
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
