import { TypedJSON } from "typedjson";
import { knownTypes } from "../engine/TransformDeclarations";
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
        this.stores = [];
        this.notebookCollectionHash = crypto.randomUUID()
        const cache = localStorage.getItem("stores_list");
        if(cache){
            const list = JSON.parse(cache) as string[];
            list.forEach(name => {
                const cache = localStorage.getItem("store_"+name);
                const store = new TypedJSON(TopStore, {knownTypes: Array.from(knownTypes())}).parse(cache)!;
                if(store){
                    this.bindSave(store);
                    store.engine.fixSerialization();
                    this.stores.push([name,store])
                }else{
                    const store = new TopStore();
                    this.bindSave(store);
                    this.stores.push([name,store])
                }
            })
            this.selected = this.stores[0][1];
            this.selectedIx = 0;
        }else{
            const name = "unnamed";
            this.selected = new TopStore();
            this.selectedIx = 0;
            this.bindSave(this.selected);
            this.stores.push([name, this.selected])
            this._updateStoresList();
        }

    }

    private _handelAsyncSave(store:TopStore){
        const record = this.stores.filter( v => v[1] === store);
        if (record){
            console.log("Store saved")
            const name = record[0][0];
            const serializer = new TypedJSON(TopStore, {knownTypes: Array.from(knownTypes())});
            const body = serializer.stringify(store);
            window.localStorage.setItem("store_"+name,body);        
        }
    }

    private _updateStoresList(){
        window.localStorage.setItem("stores_list",JSON.stringify(this.stores.map(v => v[0])))
    }

    private _dispatchStoreListUpdated(){
        this._updateStoresList()
        this.selectedListeners.forEach(v => v());
        this.collectionListeners.forEach(v => v());
    }

    private bindSave(store:TopStore){
        store.saveCallback = this._handelAsyncSave.bind(this);
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
        this.selectedIx = this.stores.length;
        this.bindSave(this.selected)
        this.stores.push([name, this.selected])
        this._dispatchStoreListUpdated();
    }

    private availableName(name: string): string{
        let name_ = name;
        let i = 1;
        while(this.stores.map(el => el[0]).includes(name_)){
            name_ = name + i;
            i++;
        }
        return name_;
    }

    // This is a litle funky, call it from UI only. It should be fine as long a user is slow.
    public saveNotebook(){
        const serializer = new TypedJSON(TopStore, {knownTypes: Array.from(knownTypes())});
        const body = serializer.stringify(this.selected);
        // console.log(body)
        // TODO: save to some storage
        return body;
    }

    public loadNotebook(name: string,body: string){
        name = this.availableName(name);
        localStorage.setItem("store_"+name,body);
        let json = new TypedJSON(TopStore, {knownTypes: Array.from(knownTypes())});
        this.selected = json.parse(body)!;
        this.bindSave(this.selected);
        this.selectedIx = this.stores.length;
        this.selected.engine.fixSerialization();
        this.stores.push([name, this.selected])
        this._dispatchStoreListUpdated();
    }

    public changeNotebook(ix: number){
        this.selectedIx = ix;
        this.selected = this.stores[ix][1];
        this._dispatchStoreListUpdated();
    }

    public renameNotebook(ix: number,newName: string){
        const name = this.stores[ix][0];
        this.stores[ix][0] = newName;
        localStorage.setItem("store_"+newName,localStorage.getItem("store_"+name)!);
        localStorage.removeItem("store_"+name);
        this.notebookCollectionHash = crypto.randomUUID()
        this._dispatchStoreListUpdated();
    }

    public deleteNotebook(ix: number){
        this.notebookCollectionHash = crypto.randomUUID()
        const name = this.stores[ix][0];
        this.stores = this.stores.slice(0, ix).concat(this.stores.slice(ix + 1))
        window.localStorage.removeItem("store_"+name);

        if(this.selectedIx == ix){
            this.selectedIx = 0;
            if(!this.stores.length){
                this.newNotebook();
            }
        } else if(this.selectedIx > ix) {
            this.selectedIx -= 1;
        }

        this.selected = this.stores[this.selectedIx][1]
        this._dispatchStoreListUpdated();

    }
}