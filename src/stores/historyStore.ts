import { jsonObject } from "typedjson";
import { ExternalEngineResponse } from "../engine/engine";
import { GraphFilterStore } from "./graphFilterStore";
import { IPersistentStore } from "./storeInterfaces";

@jsonObject
export class HistoryStore extends GraphFilterStore implements IPersistentStore{
    // TODO: this about saving to max depth
    history: ExternalEngineResponse[] = [];
    future: ExternalEngineResponse[] = [];

    
    _handleEngineInfo(event: ExternalEngineResponse): void {
        if (!event.isHistoryUpdate){
            this.history.push(event);
            this.future = [];
        }else{
            this.future.push(event);
        }
    }

    public history_rollback(): void {
        if (this.history.length == 0) return;
        this.engine.batchState.response.isHistoryUpdate = true;
        const diff = this.history.pop()!;
        // TODO
        diff.node.removed_nodes.forEach( node => this.engine._addNode(node))
        diff.node.updated_params.forEach(update => {
            let obj:any = {};
            obj[update.key] = update.old;
            this.engine.updateNodeParams(update.node_id,obj)})
        diff.connection.removed.forEach(v => this.connectNodes(v))
        diff.connection.added.forEach(v => this.disconnectNodes(v))
        diff.node.added.forEach(n => this.removeTransform(n));
    }

    public history_redo(): void {

    }
}