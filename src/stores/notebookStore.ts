import { TypedJSON } from "typedjson";
import { GraphFilterStore } from "./graphFilterStore";

export class NotebookStore{
    stores: Map<String,GraphFilterStore>

    selectedName: string
    selected: GraphFilterStore
    selectedListeners: CallableFunction[]

    constructor(){
        this.stores = new Map();
        this.selectedName = "unnamed";
        this.selected = new GraphFilterStore();
        this.selectedListeners = [];
    }

    public getSelected(){
        return this.selected
    }

    public getSelectedName(){
        return this.selectedName
    }

    public subscribeSelected(listener: ()=> void){
        this.selectedListeners = [...this.selectedListeners,listener];
        return () => {
            this.selectedListeners = this.selectedListeners.filter(f => f != listener);
        }
    }

    public newNotebook(){
        this.selectedName = "unnamed"
        let i = 1;
        while(this.stores.has(this.selectedName)){
            this.selectedName = "unnamed" + i;
            i++;
        }
        this.selected = new GraphFilterStore();
        this.selectedListeners.forEach(v => v());
    }

    public saveNotebook(){
        const serializer = new TypedJSON(GraphFilterStore);
        const body = serializer.stringify(this.selected);
        console.log(body)
        // TODO: save to some storage
    }

    public changeNotebook(name: string){
        if (this.stores.has(name)){
            this.selected = this.stores.get(name)!;
            this.selectedName = name;
            this.selectedListeners.forEach(v => v());
        }else{
            console.log("store not exist")
        }
    }

    public renameNotebook(oldName: string,newName: string){
        if (this.stores.has(oldName)){
            const store = this.stores.get(oldName)!;
            this.stores.delete(oldName);
            this.stores.set(newName,store);
            if (oldName == this.selectedName){
                this.selectedName = newName;
                this.selectedListeners.forEach(v => v());
            }
        }else{
            console.log("store not exist");
        }
    }

    public deleteNotebook(name: string){
        if (this.stores.has(name)){
            this.stores.delete(name);
            if (this.selectedName === name){
                if (this.stores.size){ // change to first in map
                    const [name,store] = this.stores.values().next().value;
                    this.selectedName = name;
                    this.selected = store;
                }else{
                    this.newNotebook(); // there is none
                }
                this.selectedListeners.forEach(v => v());
            }
        }else{
            console.log("store not exist");
        }
    }
}