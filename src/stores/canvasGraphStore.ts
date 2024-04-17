import { GraphFilterStore } from "./graphFilterStore";

export abstract class CanvasGraphStore extends GraphFilterStore{
    canvasConfig: {

    }
    canvasConfigListener: CallableFunction[]
    
    constructor(){
        super()
        this.canvasConfig = {};
        this.canvasConfigListener = [];
    }
}