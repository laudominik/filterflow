import { ReactElement, ReactNode } from 'react'
import { AnyT, jsonMember, jsonObject } from 'typedjson';
import { node } from './node';

type CanvasPosition = [number,number]; 
type CanvasSelection = {start: CanvasPosition, size: CanvasPosition, center: CanvasPosition}
type GUID = string;
export interface KVParams {
    [key: string]: any
}

// abstract class Transform extends node<Transform> {
//     _update_node(): void 
//     abstract paramView(guid: GUID): ReactElement;
    
//     visualizationView(guid: GUID) 

//     // TODO add meta to promise (about color)
//     async apply(input:OffscreenCanvas|undefined): Promise<OffscreenCanvas|undefined>

//     async _apply(input:OffscreenCanvas): Promise<OffscreenCanvas> 

//     // TODO: better naming?
//     public fromDestinationToSourcePosition(position: [number, number]): [number, number] 

//     public fromSourceToDestinationPosition(positon: [number, number]): [number, number] 

//     public getPixels(position: [number, number], size: [number, number], result?: Uint8Array): Uint8Array

//     public fromPositionToSelection(position: [number, number]): CanvasSelection

//     public fromPositionToSourceSelection(position: [number, number]): CanvasSelection 

//     public getImageString(): string 

//     public getCanvas(): OffscreenCanvas 

//     public getWebGLContext(): WebGLRenderingContext 

//     public getHash(): GUID

//     public getPos(): {x: number, y: number}

//     public setPos(pos: {x: number, y: number})

//     async setImageString(image: string) 

//     setEnabled(enabled: boolean)

//     getEnabled()

//     setExpanded(expanded: boolean)

//     getExpanded()

//     updateParams(params: KVParams): void 

//     getParams() : KVParams {

//     getColor(): string 

//     getName(): string 
// }

