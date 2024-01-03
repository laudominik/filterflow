import { ReactNode } from "react";
import Transform from "../Transform";
import { jsonObject } from "typedjson";

@jsonObject
export default class SourceTransform extends Transform{
    public _update_node(): void {
        throw new Error("Method not implemented.");
    }
    image?: string

    constructor(){
        super("source","#HEX");

    }

    async apply(input: OffscreenCanvas | undefined): Promise<OffscreenCanvas | undefined> {
        // for the source node we ignore inputs

        if(this.image === undefined || this.image === null || this.image === "") return undefined;
        

        return this.canvas;
    }

    async setImageString(imageString: string) {
        this.image = imageString;

        const image = new Image()
        const loadImage = async (img: HTMLImageElement) => {
            return new Promise((resolve, reject) => {
                img.onload = async () => {
                    resolve(true);
                };
            });
        };
        image.src = this.image;
        await loadImage(image);
        this.canvas.width = image.width;
        this.canvas.height = image.height;
        
        const ctx = this.canvas.getContext("2d");
        ctx?.drawImage(image, 0,0);
        this.hash = crypto.randomUUID();
    }

    updateParams(params: { [key: string]: any; }): void {
        this.image = params["image"];
    }
    paramView(): ReactNode {
        return <></>
    }
}