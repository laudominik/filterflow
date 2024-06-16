import { jsonObject } from "typedjson";
import { HistoryStore } from "./historyStore";
import { ExternalEngineResponse } from "../engine/engine";

@jsonObject({name:"TopStore"})
export class TopStore extends HistoryStore{
    hash: string
    saveCallback?: (store: TopStore) => void;

    constructor(){
        super()
        this.hash = crypto.randomUUID();
    }

    _handleEngineInfo(event: ExternalEngineResponse): void {
        super._handleEngineInfo(event);
        if (this.saveCallback){
            console.log("async save")
            this.saveCallback(this);
        }else{
            console.log("async not bound")
        }
    }

    public fixSerialization(){
        this._bindToEngine();
        this.engine.fixSerialization();
    }
}