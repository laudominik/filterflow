import { Engine, ExternalEngineResponse } from "../engine/engine"
import { ConnectionDefinition, ConnectionInfo } from "./storeInterfaces";
import { PreviewStores } from "./previewStore";
import { AnyT, TypedJSON, jsonArrayMember, jsonMember, jsonObject } from "typedjson";
import Transform from "../engine/Transform";
import { IEngine } from "../engine/iengine"
import { knownTypes } from "../engine/TransformDeclarations";
import declareOps from "../engine/TransformRegistration";

@jsonObject
export class GraphFilterStore extends PreviewStores{
 
    connectionsListener: CallableFunction[]
    @jsonArrayMember(AnyT)
    connections: ConnectionInfo[]

    constructor() {
        super(new Engine());
        this.connectionsListener = [];
        this.connections = [];

        this.engine.addEventListener("update",this.handleEngineInfo.bind(this) as any)
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
        if (this.engine.connectNodes(source,destination,source_handle,destination_handle)){
            this.connections = [...this.connections,{connectionDefinition:connection,display:[[0,0],[0,0]]}];
            this.emitChangeConnections();
        }
        // Store state only update Nodes, connection is between nodes
    }
    //#endregion
    
    //#endregion
    
    //#region Persistence
    public save(): string {
        const serializer = new TypedJSON(Engine)
        
        const toSerialize = {
            // @ts-ignore
            "engine" : serializer.stringify(this.engine),
            "nodeCollection": JSON.stringify(this.nodeCollection),
            "connectionCollection": JSON.stringify(this.connections),
            "previewStores": JSON.stringify(Array.from(this.previewStores.entries()))
        }
        // TODO: rest of the stuff
        return JSON.stringify(toSerialize)
    }
    public saveToIndex(notebookIndex: number) {
        const allSaved = sessionStorage.getItem("engines")
        if(!allSaved ) return;
        const allSavedParsed = JSON.parse(allSaved)
        allSavedParsed[notebookIndex] = this.save();
        sessionStorage.setItem("engines", JSON.stringify(allSavedParsed))
    }
    
    public loadFromIndex(notebookIndex: number): void {
        // construct fresh everything 
        this.engine = new Engine()
        this.connections = []
        

        const allSaved = sessionStorage.getItem("engines")
        if(!allSaved ) return;
        const allSavedParsed = JSON.parse(allSaved)
    
        const thisSaved = allSavedParsed[notebookIndex]
        if(!thisSaved) return;
        this.loadFromSerialized(thisSaved)

        // emit everything
    }

    public loadFromSerialized(serialized: string): void {
        const thisSaved = JSON.parse(serialized)
        
        const savedEngine = thisSaved["engine"]
        const savedNodeCollection = thisSaved["nodeCollection"]
        const savedConnectionCollection = thisSaved["connectionCollection"]
        const savedPreviewStores = thisSaved["previewStores"]

        if(!savedEngine || !savedNodeCollection || !savedConnectionCollection) return;


        const serializer = new TypedJSON(Engine, {knownTypes: Array.from(knownTypes())})
        // const previewSerializer = new TypedJSON()
        // deserialize
        const parsedEngine = serializer.parse(savedEngine)
        const parsedNodeCollection = JSON.parse(savedNodeCollection)
        const parsedConnectionCollection = JSON.parse(savedConnectionCollection)
        const parsedPreviewStores = JSON.parse(savedPreviewStores)

        if(!parsedEngine || !parsedNodeCollection) return

        this.engine = parsedEngine  
        this.nodeCollection = parsedNodeCollection
        this.connections = parsedConnectionCollection as any
        // this.previewStores = new Map(parsedPreviewStores)
        console.log("obobobobo", this.previewStores)

        this.engine.fixSerialization();

        this.emitChangeConnections()
        this.emitChangePreviews()
        this.emitChangeNodeCollection()
        //this.emitChangeConnections()
        // TODO: parse rest of the props

    }

    public rollback(){

        const selectedIndex = sessionStorage.getItem("selectedTabIx")
        if(!selectedIndex) return 
        this.loadFromIndex(JSON.parse(selectedIndex))
    }

    public commit(): string {
        const selectedIndex = sessionStorage.getItem("selectedTabIx")
        if(!selectedIndex) return ""
        this.saveToIndex(JSON.parse(selectedIndex))
        return ""
    }

    //#endregion
}
