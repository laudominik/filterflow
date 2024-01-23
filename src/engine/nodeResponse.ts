export type GUID = string;

export interface NodeResponseUpdated{
    nodeId: GUID,
    status: "updated",
    requestUpdates: GUID[]
}


export interface NodeResponseError{
    nodeId: GUID,
    status: "error",
    invalidateChildrens: GUID[] // if error ocure in parent tree all childeren are invalid
    error: string
    // children should emit same error TODO add handle to send invalidateNode or we want to handle it difrently
} // error msg or status avalible on node

export type NodeResponse = NodeResponseUpdated | NodeResponseError 
