import Transform from "../engine/Transform";

export type GUID = string;


/*
    
    @ConnectionSide [GUID, number of input/output]
*/
export type ConnectionDefinition = [ConnectionSide,ConnectionSide];
export type ConnectionSide = [GUID,number];

export type CanvasPosition = [number,number]; // x y
export type CanvasArrow = [CanvasPosition,CanvasPosition]
export interface ConnectionInfo{
    connectionDefinition: ConnectionDefinition
    display: CanvasArrow
}

export type PreviewType = {start: GUID, end: GUID, distance: number, visualizationChannel: Channel, previewChannels: Channel[]}
// For now we support only rectangles as selection

export type CanvasPointer = {source: CanvasPosition ,destination: CanvasPosition}
export type CanvasSelection = {start: CanvasPosition, size: CanvasPosition, center: CanvasPosition}
export type PreviewSelections = {source: CanvasSelection, destination: CanvasSelection}
export enum Channel {NONE = "NONE", RED = "RED", GREEN = "GREEN", BLUE = "BLUE", GRAY = "GRAY"};
export const ChannelValue: Record<keyof typeof Channel, number> = {
    NONE: 0,
    RED: 0,
    GREEN: 1,
    BLUE: 2,
    GRAY: 0
};

type Func = () => void
type SubscribeWrapper = (listener:Func) => Func

// all api connected with Node Collection and nodes
export interface INodeStore{
    getNode(id: GUID): () => {value: Transform,hash: string}
    getNodeCollection(): GUID[]
    
    updateParam(id:GUID,param: any): void
    addTransform(name: string,params: any): Transform
    removeTransform(id: GUID): void
    
    subscribeNode(id: GUID): SubscribeWrapper
    subscribeNodeCollection(listener: Func): Func
}

export interface IConnectionStore{
    getConnections():  ConnectionInfo[]
    subscribeConnections(listener: Func): CallableFunction
    
    disconnectNodes(connection: ConnectionDefinition): void
    connectNodes(connection: ConnectionDefinition): void
}

// this layer must exist for compatibility 
export interface IPreviewStores{
    subscribePreviews(listener: Func): CallableFunction
    getPreviews(): Map<string, IPreviewStore>
    getPreviewStore(name:string): IPreviewStore | undefined
    addPreviewStore(name:string,inputs: GUID[],output: GUID): void
    removePreviewStore(name: string): void // this will not close any windows
}

export interface IPreviewStore{
    // toggleLock(): boolean

    getSelection(): {
        pointer: CanvasPointer
        preview: PreviewSelections
        channel: Channel
    }
    subscribeSelection(listener: Func): Func
    updateSelection(pointer: CanvasPointer, preview: PreviewSelections, channel: Channel): void
    updateContext(inputs: GUID[],output: GUID): void
    getContext(): {inputs: GUID[],output: GUID}
    subscribeContext(listener: Func): Func

}
