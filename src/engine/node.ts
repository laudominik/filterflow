

export abstract class node<T extends node<T>>{
    meta:{
        input_size: Number,
        output_size: Number,
    }
    inputs: Map<Number,[T,Number]>
    connected_to_outputs: Map<Number,[T,Number][]> // two way linked list

    constructor(inputs:Number,outputs:Number){
        this.inputs = new Map()
        this.connected_to_outputs = new Map()
        this.meta = {
            input_size:inputs,
            output_size: outputs
        }
    }

    // CRUD
    // CREATE (done by external entity)
    // Connect
    // disconnect (disconnect one of input/outputs)
    // remove (only disconnect and send msg about remove)
    // update (on child element)
}