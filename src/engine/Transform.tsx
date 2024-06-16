import {ReactElement, ReactNode} from 'react'
import {AnyT, jsonMapMember, jsonMember, jsonObject} from 'typedjson';
import {node} from './node';

type CanvasPosition = [number, number];
type CanvasSelection = {start: CanvasPosition, size: CanvasPosition, center: CanvasPosition}
type GUID = string;
export interface KVParams {
    [key: string]: any
}

@jsonObject({name:"point"})
class point {
    @jsonMember(Number)
    public x: number = 0
    @jsonMember(Number)
    public y: number = 0

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

@jsonObject({name:"Transform"})
abstract class Transform extends node<Transform> {
    @jsonMember(point)
    pos: point
    @jsonMember(point)
    prevPos: point
    @jsonMember(String)
    color: string;
    @jsonMember(String)
    name: string;
    // @jsonMember(String)
    image?: string;
    @jsonMember(Boolean)
    edited: boolean;
    @jsonMember(Boolean)
    enabled: boolean;
    @jsonMember(Boolean)
    expanded: boolean;
    @jsonMember(AnyT)
    params: KVParams;
    @jsonMember(String)
    hash: GUID;
    isSource: boolean
    canvas: OffscreenCanvas;
    gl: WebGLRenderingContext;

    constructor(name: string, color: string, inputs?: number) {
        super({id: crypto.randomUUID(), inputs: inputs ?? 1, outputs: 1});
        this.color = color;
        this.name = name;
        this.params = {};
        this.enabled = true;
        this.expanded = true;
        this.edited = true;
        this.canvas = new OffscreenCanvas(1, 1);
        this.gl = this.canvas.getContext("webgl", {preserveDrawingBuffer: true})!;
        this.hash = crypto.randomUUID();
        this.pos = new point(0, 0)
        this.prevPos = new point(0, 0)
        this.isSource = false;
    }

    public async _update_node(): Promise<boolean> {
        // based on input connections perform calculations
        let inputs = [];

        for (let i = 0; i < this.meta.input_size; i++) {
            const input = this.inputs.get(i);
            if (input) {
                const node = this.engine.getNode(input[0]);
                if (node && node.valid) {
                    inputs.push(node.canvas);
                } else {
                    inputs.push(undefined);
                }
            } else {
                inputs.push(undefined);
            }

        }
        try {
            return await this.apply(inputs) != undefined;
        } catch (error) {
            console.error(error)
            console.error("apply function failed for Transform");
            return false;
        }

    }

    public abstract paramView(guid: GUID): ReactElement;

    visualizationView(guid: GUID) {
        return <></>
    };

    public getInputSize() {
        return this.meta.input_size
    }

    // TODO add meta to promise (about color)
    async apply(input: Array<OffscreenCanvas | undefined>): Promise<OffscreenCanvas | undefined> {
        if (!this.enabled) {
            return input[0];
        }
        if (!input.length || input.includes(undefined)) {
            return undefined
            // this.dispatch_update();
        }

        // TODO: remove setting state in transform?
        this.hash = crypto.randomUUID();
        const ret = await this._apply(input as Array<OffscreenCanvas>);
        // this.update_node();
        return ret;
    }

    async _apply(input: Array<OffscreenCanvas>): Promise<OffscreenCanvas> {
        return input[0];
    }

    // TODO: better naming?
    public fromDestinationToSourcePosition(position: [number, number]): [number, number] {
        return position
    }

    public fromSourceToDestinationPosition(positon: [number, number]): [number, number] {
        return positon
    }

    public getPixels(position: [number, number], size: [number, number], result?: Uint8Array): Uint8Array {
        const arrayLength = 4 * size[0] * size[1] // 4 for RGBA bits
        if (!result || result.length < arrayLength)
            result = new Uint8Array(arrayLength)

        this.gl.readPixels(position[0], position[1], size[0], size[1], this.gl.RGBA, this.gl.UNSIGNED_BYTE, result);
        return result
    }

    public fromPositionToSelection(position: [number, number]): CanvasSelection {
        return {start: position, size: [1, 1], center: position}
    }

    public fromPositionToSourceSelection(position: [number, number]): CanvasSelection {
        return {start: position, size: [1, 1], center: position}
    }

    public getImageString(): string {
        return this.image ?? "";
    }

    public getCanvas(): OffscreenCanvas {
        return this.canvas
    }

    public getWebGLContext(): WebGLRenderingContext {
        return this.gl
    }

    public getHash(): GUID {
        return this.hash
    }

    public getPos(): {x: number, y: number} {
        return this.pos
    }

    public getPreviewPos(): {x: number, y: number} {
        return this.prevPos;
    }

    public setPos(pos: {x: number, y: number}) {
        this.pos = new point(pos.x, pos.y)
    }

    public setPreviewPos(pos: {x: number, y: number}) {
        this.prevPos = new point(pos.x, pos.y);
    }

    async setImageString(image: string) {
        this.image = image;
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled
    }

    getEnabled() {
        return this.enabled
    }

    setExpanded(expanded: boolean) {
        this.expanded = expanded
    }

    getExpanded() {
        return this.expanded
    }

    async updateParams(params: KVParams): Promise<void> {
        this.params = {...this.params, ...params};

        if (this.edited == false && Object.keys(params).length != 0) {
            this.name = `${this.name}[edited]`
            this.edited = true;
        }
        this.hash = crypto.randomUUID();
    }

    getParams(): KVParams {
        return this.params;
    }

    getColor(): string {
        return this.color;
    }

    getName(): string {
        return this.name;
    }
}

export default Transform