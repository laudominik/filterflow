import { jsonObject } from "typedjson";
import { HistoryStore } from "./historyStore";
import { ExternalEngineResponse } from "../engine/engine";

@jsonObject
export class TopStore extends HistoryStore{
    saveCallback?: (store: TopStore) => void;

    _handleEngineInfo(event: ExternalEngineResponse): void {
        super._handleEngineInfo(event);
        if (this.saveCallback){
            console.log("async save")
            this.saveCallback(this);
        }else{
            console.log("async not bound")
        }
    }
}