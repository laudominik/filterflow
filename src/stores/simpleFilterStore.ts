import { createContext } from "react";
import Transform  from '../engine/Transform'

type MarkedListener = CallableFunction & { id: Number }

class simpleFilterStore {
    listeners: MarkedListener[]
    transforms: Transform[]
    
    // hard wired tmp values, change later to engine ref
    source?: string
    destination?: string
    kernel?: string[][]

    constructor() {
        this.listeners = [];
        this.transforms = [];
        this.kernel = Array(3).fill(0).map(() => new Array(3).fill(0));
    }

    // internal function called to return snapshot of data with id
    private _getView(id: Number) {
        if (id === 0) {
            return this.source
        }
        if (id === 1) {
            return this.destination
        }
        return this.kernel
        // TODO: change it
    }

    // internal function register listening on specific id
    private _subscribeView(id: Number, listener: MarkedListener) {
        listener.id = id;
        this.listeners = [...this.listeners, listener]
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // helper functions
    // due to inability to pass additional args its the best way to add args
    public subscribeView(id: Number) {
        return this._subscribeView.bind(this, id);
    }

    public getView(id: Number) {
        return this._getView.bind(this, id);
    }

    public setKernel(kernel: string[][]){
        this.kernel = kernel;
        this.emitChange(69);
        if(!this.source) return;
        this.applyTransforms(this.source);
    }

    // set filter store root mask what is happening with data
    public setSource(imageEncoded: string) {
        this.source = imageEncoded;
        //callback hell
        this.applyTransforms(imageEncoded)
    }

    private emitChange(id: Number) {
        this.listeners.filter(f => f.id === id).forEach(f => f())
    }

    private applyTransforms(imageEncoded: string){
        const dispatch = async (input: string) => {
            const image = new Image();
            image.onload = () => {


            const offscreenCanvas = new OffscreenCanvas(image.width, image.height);
            //TODO: BUG to fix canvas sometimes get size 0x0
            const ctx = offscreenCanvas.getContext('2d')!;
            //@ts-ignore
            ctx.drawImage(image, 0, 0);
            //@ts-ignore
            const imageData = ctx.getImageData(0, 0, image.width, image.height);
            const imageTransformedData = new ImageData(image.width, image.height);
            
            const kernel = this.kernel!;
            const kernelSize = kernel.length;
            const kernelRadius = Math.floor(kernel.length / 2);

            // here we should call the transform pipeline
            //  (*) before that we could make use of reversing the flattening of the image
            // also we shouldn't assume that the image has all the channels
            for(let y = 0; y < image.height; y++){
                for(let x = 0; x < image.width; x++){
                    const resultIndex = (y * image.width + x) * 4;
                    let sumR = 0, sumG = 0, sumB = 0;

                    if(y < kernelRadius || x < kernelRadius || x + kernelRadius >= image.width || y + kernelRadius >= image.height){
                        imageTransformedData.data[resultIndex] = 0;
                        imageTransformedData.data[resultIndex + 1] = 0;
                        imageTransformedData.data[resultIndex + 2] = 0;
                        imageTransformedData.data[resultIndex + 3] = 255; 
                        continue;
                    }

                    for(let i = 0; i < kernelSize; i++){
                        for(let j = 0; j < kernelSize; j++){
                            const pixelX = x + j - kernelRadius;
                            const pixelY = y + i - kernelRadius;

                            const dataIndex = (pixelY * image.width + pixelX) * 4;
                            sumR += imageData.data[dataIndex] * parseInt(kernel[i][j]);
                            sumG += imageData.data[dataIndex + 1] * parseInt(kernel[i][j]);
                            sumB += imageData.data[dataIndex + 2] * parseInt(kernel[i][j]);
                        }
                    }

                    imageTransformedData.data[resultIndex] = sumR;
                    imageTransformedData.data[resultIndex + 1] = sumG;
                    imageTransformedData.data[resultIndex + 2] = sumB;
                    imageTransformedData.data[resultIndex + 3] = 255; 
                }
            }

            // for (let i = 0; i < imageData.data.length; i += 1){                
            
            //     imageTransformedData.data[i] = 0; //R
            //     imageTransformedData.data[i + 1] = 0; //G
            //     imageTransformedData.data[i + 2] = 0; //B
            //     imageTransformedData.data[i + 3] = 255; //A
            // }

            console.log(imageTransformedData)
            //@ts-ignore
            ctx.putImageData(imageTransformedData,0,0);
            //@ts-ignore
            console.log(offscreenCanvas) // debug
            //@ts-ignore
            offscreenCanvas.convertToBlob({type:"image/png",quality:1}).then((blob:Blob) => {
                // Use FileReader to read the Blob as a Data URL
                this.destination=URL.createObjectURL(blob);
                this.emitChange(0);
                this.emitChange(1);
            });
        }
        image.src = input;

        }
        dispatch(imageEncoded);
    }
}

const FilterStoreContext = createContext(new simpleFilterStore()) // using it without provider makes it global

export { FilterStoreContext }