import { TypedJSON } from "typedjson";
import { knownTypes } from "../engine/TransformDeclarations";
import { HistoryStore } from "./historyStore";
import { TopStore } from "./topStore";

export class NotebookStore{
    stores: Array<[string,TopStore]>

    selectedIx: number
    selected: TopStore
    collectionListeners: CallableFunction[]
    notebookCollectionHash: string
    selectedListeners: CallableFunction[]

    constructor(){
        this.selectedIx = 0;
        this.selected = new TopStore();
        this.selectedListeners = [];
        this.collectionListeners = [];
        this.notebookCollectionHash = crypto.randomUUID()
        this.stores = [["untitled", this.selected]];
    }

    public getSelected(){
        return this.selected
    }

    public getSelectedIx(){
        return this.selectedIx
    }

    public subscribeNotebookCollection(listener: ()=> void){
        this.collectionListeners = [...this.collectionListeners,listener];
        return () => {
            this.collectionListeners = this.collectionListeners.filter(f => f != listener);
        }
    }

    public getNotebookCollection(){
        return this.notebookCollectionHash
    }

    public subscribeSelected(listener: ()=> void){
        this.selectedListeners = [...this.selectedListeners,listener];
        return () => {
            this.selectedListeners = this.selectedListeners.filter(f => f != listener);
        }
    }

    public newNotebook(){
        this.selectedIx = 0
        const name = this.availableName("unnamed")
        this.selected = new TopStore();
        this.stores.push([name, this.selected])
        this.selectedListeners.forEach(v => v());
    }

    private availableName(name: string){
        let name_ = name;
        let i = 1;
        while(this.stores.map(el => el[0]).includes(name_)){
            name_ = name + i;
            i++;
        }
        return name_
    }

    public saveNotebook(){
        const serializer = new TypedJSON(TopStore);
        const body = serializer.stringify(this.selected);
        console.log(body)
        // TODO: save to some storage
        return body;
    }

    public loadNotebook(name: string, body: string){
        let json = new TypedJSON(TopStore,{knownTypes: Array.from(knownTypes())});
        this.selected = json.parse(body)!;
        this.selected.engine.fixSerialization();
        this.selectedIx = this.stores.length
        this.stores.push([this.availableName(name), this.selected])
        this.selectedListeners.forEach(v => v());
    }

    public changeNotebook(ix: number){
        this.selectedIx = ix;
        this.selected = this.stores[ix][1];
        this.selectedListeners.forEach(v => v());
    }

    public renameNotebook(ix: number,newName: string){
        this.stores[ix][0] = newName;
        this.notebookCollectionHash = crypto.randomUUID()
        this.collectionListeners.forEach(v => v());
        this.selectedListeners.forEach(v => v());
    }

    public deleteNotebook(ix: number){
        this.notebookCollectionHash = crypto.randomUUID()
        this.stores = this.stores.slice(0, ix).concat(this.stores.slice(ix + 1))
        if(this.selectedIx == ix){
            this.selectedIx = 0;
            if(!this.stores.length){
                this.newNotebook();
            }
        } else if(this.selectedIx > ix) {
            this.selectedIx -= 1;
        }
        this.collectionListeners.forEach(v => v());
        this.selectedListeners.forEach(v => v());
    }
}