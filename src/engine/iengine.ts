export type GUID = string;

export interface IEngine<T> extends EventTarget {
    requestUpdate(id: string): void;
    updateNodeParams(node:GUID,params:any):void
    addNode(transformation: string, params: any): GUID
    removeNode(guid:GUID): void
    connectNodes(source:GUID,destination:GUID,source_handle: number,destination_handle:number): boolean
    disconnectNodes(source:GUID,destination:GUID,source_handle: number,destination_handle:number): boolean 
    getNode(node:GUID): T | undefined;
    update_all(): void
    internal: EventTarget;
    fixSerialization(): void;
}
