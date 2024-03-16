import { GraphFilterStore } from "./graphFilterStore";

class CanvasGraphStore extends GraphFilterStore{
    canvasConfig: {

    }
    canvasConfigListener: CallableFunction[]
    
    constructor(){
        super()
        this.canvasConfig = {};
        this.canvasConfigListener = [];
    }
}