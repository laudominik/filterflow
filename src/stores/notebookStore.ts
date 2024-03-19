import { TypedJSON } from "typedjson";
import { knownTypes } from "../engine/TransformDeclarations";
import { HistoryStore } from "./historyStore";
import { TopStore } from "./topStore";

export class NotebookStore{
    stores: Array<[string,TopStore]>

    selectedName: string
    selected: TopStore
    collectionListeners: CallableFunction[]
    notebookCollectionHash: string
    selectedListeners: CallableFunction[]

    constructor(){
        this.stores = new Array();
        this.selectedName = "unnamed";
        this.selected = new TopStore();
        this.selectedListeners = [];
        this.collectionListeners = [];
        this.notebookCollectionHash = crypto.randomUUID()
        this.stores.push([this.selectedName, this.selected])
    }

    public getSelected(){
        return this.selected
    }

    public getSelectedName(){
        return this.selectedName
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
        this.selectedName = "unnamed"
        let i = 1;
        while(this.stores.map(el => el[0]).includes(this.selectedName)){
            this.selectedName = "unnamed" + i;
            i++;
        }
        this.selected = new TopStore();
        this.stores.push([this.selectedName, this.selected])
        this.selectedListeners.forEach(v => v());
    }

    public saveNotebook(){
        const serializer = new TypedJSON(TopStore);
        const body = serializer.stringify(this.selected);
        console.log(body)
        // TODO: save to some storage
        return body;
    }

    public loadNotebook(name: string,body: string){
        let json = new TypedJSON(TopStore,{knownTypes: Array.from(knownTypes())});
        this.selected = json.parse(body)!;
        this.selected.engine.fixSerialization();
        this.selectedName = name;
        this.stores.push([name, this.selected])
        console.log(this.selected);
        this.selectedListeners.forEach(v => v());
    }

    public changeNotebook(name: string){
        if (this.stores.map(el => el[0]).includes(name)){
            this.selected = this.stores.find(el => el[0] == name)![1]
            this.selectedName = name;
            this.selectedListeners.forEach(v => v());
        }else{
            console.log("store not exist")
        }
    }

    public renameNotebook(oldName: string,newName: string){
        if (this.stores.map(el => el[0]).includes(oldName)){
            const ix = this.stores.findIndex(el => el[0] == oldName)
            this.stores[ix] = [newName, this.stores[ix][1]]
            if (oldName == this.selectedName){
                this.selectedName = newName;
                this.selectedListeners.forEach(v => v());
            }
        }else{
            console.log("store not exist");
        }
    }

    public deleteNotebook(name: string){
        if (this.stores.map(el => el[0]).includes(name)){
            this.stores = this.stores.filter(el => el[0] != name)
            this.notebookCollectionHash = crypto.randomUUID()
            this.collectionListeners.forEach(v => v());
            if (this.selectedName === name){
                if (this.stores.length){ // change to first in map
                    const [name, store] = this.stores[0];
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