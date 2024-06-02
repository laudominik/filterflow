import {TypedJSON} from "typedjson";
import {knownTypes} from "../engine/TransformDeclarations";
import {TopStore} from "./topStore";
import KVHandlerIfc from "../persistence/kvhandler";
import LSHandler from "../persistence/lshandler";
import DebugHandler from "../persistence/debughandler";
import {ImageStore} from "./imageStore";

export class NotebookStore {
    stores: Array<[string, TopStore]>
    selectedIx: number
    selected: TopStore
    collectionListeners: CallableFunction[]
    notebookCollectionHash: string
    selectedListeners: CallableFunction[]
    persistence: KVHandlerIfc

    constructor() {
        this.selectedIx = 0
        this.selected = new TopStore();
        this.selectedListeners = [];
        this.collectionListeners = [];
        this.stores = [];
        this.notebookCollectionHash = crypto.randomUUID()
        this.persistence = new DebugHandler(true)

        const cache = this.persistence.read("stores_list");
        if (cache) {
            const list = JSON.parse(cache) as string[];
            list.forEach(name => {
                const cache = this.persistence.read("store_" + name);
                const store = new TypedJSON(TopStore, {knownTypes: Array.from(knownTypes())}).parse(cache)!;
                if (store) {
                    this.bindSave(store);
                    store.fixSerialization();
                    this.stores.push([name, store])
                } else {
                    const store = new TopStore();
                    this.bindSave(store);
                    this.stores.push([name, store])
                }
            })
            this.selected = this.stores[0][1];
            this.selectedIx = 0
        } else {
            const name = "unnamed";
            this.selected = new TopStore();
            this.selectedIx = 0
            this.bindSave(this.selected);
            this.stores.push([name, this.selected])
            this._updateStoresList();
        }
        this.setSelectedIx(0)

    }

    private _handelAsyncSave(store: TopStore) {
        const record = this.stores.filter(v => v[1] === store);
        if (record.length) {
            console.log("Store saved")
            const name = record[0][0];
            const serializer = new TypedJSON(TopStore, {knownTypes: Array.from(knownTypes())});
            const body = serializer.stringify(store);
            this.persistence.write("store_" + name, body);
        } else {
            console.warn("Store not exist so skipping save");
        }
    }

    private _updateStoresList() {
        this.persistence.write("stores_list", JSON.stringify(this.stores.map(v => v[0])))
    }

    private _dispatchStoreListUpdated() {
        this._updateStoresList()
        this.selectedListeners.forEach(v => v());
        this.collectionListeners.forEach(v => v());
    }

    private bindSave(store: TopStore) {
        store.saveCallback = this._handelAsyncSave.bind(this);
    }

    public getSelected() {
        return this.selected
    }

    public getSelectedIx() {
        return this.selectedIx
    }

    public subscribeNotebookCollection(listener: () => void) {
        this.collectionListeners = [...this.collectionListeners, listener];
        return () => {
            this.collectionListeners = this.collectionListeners.filter(f => f != listener);
        }
    }

    public getNotebookCollection() {
        return this.notebookCollectionHash
    }

    public subscribeSelected(listener: () => void) {
        this.selectedListeners = [...this.selectedListeners, listener];
        return () => {
            this.selectedListeners = this.selectedListeners.filter(f => f != listener);
        }
    }

    public newNotebook() {
        const name = this.availableName("unnamed")
        this.selected = new TopStore();
        this.bindSave(this.selected)
        this.stores.push([name, this.selected])
        this.setSelectedIx(this.stores.length - 1)
        this._dispatchStoreListUpdated();
    }

    public availableName(name: string): string {
        let name_ = name;
        let i = 1;
        while (this.stores.map(el => el[0]).includes(name_)) {
            name_ = name + i;
            i++;
        }
        return name_;
    }

    // This is a litle funky, call it from UI only. It should be fine as long a user is slow.
    public saveNotebook() {
        const serializer = new TypedJSON(TopStore, {knownTypes: Array.from(knownTypes())});
        const body = serializer.stringify(this.selected);
        return body;
    }

    public loadNotebook(name: string, body: string) {
        name = this.availableName(name);
        this.persistence.write("store_" + name, body);
        let json = new TypedJSON(TopStore, {knownTypes: Array.from(knownTypes())});
        this.selected = json.parse(body)!;
        this.bindSave(this.selected);
        this.stores.push([name, this.selected])
        this.setSelectedIx(this.stores.length - 1)
        this._dispatchStoreListUpdated();
        this.selected.fixSerialization(); // must be last for store to see update
        // this.selected.engine.update_all()
    }

    private setSelectedIx(ix: number) {
        this.selectedIx = ix
        ImageStore.setSelectedName(this.stores[ix][0])
    }

    public changeNotebook(ix: number) {
        this.setSelectedIx(ix)
        this.selected = this.stores[ix][1];
        this._dispatchStoreListUpdated();
    }

    public renameNotebook(ix: number, newName: string) {
        const name = this.stores[ix][0];
        newName = this.availableName(newName)
        this.stores[ix][0] = newName;
        this.persistence.write("store_" + newName, this.persistence.read("store_" + name)!);
        this.persistence.write("imageList" + newName, this.persistence.read("imageList" + name)!)
        this.persistence.delete("store_" + name)
        this.persistence.delete("imageList" + name)
        this.notebookCollectionHash = crypto.randomUUID()
        this._dispatchStoreListUpdated();
        this.setSelectedIx(this.selectedIx)
    }

    public canRemoveImage(hash: string, skipName: string) {
        for (const store of this.stores) {
            const name = store[0]
            if (name == skipName) continue;
            if (ImageStore.getImageList(name).includes(hash)) {
                return false;
            }
        }
        return true;
    }

    public deleteNotebook(ix: number) {
        this.notebookCollectionHash = crypto.randomUUID()
        const name = this.stores[ix][0];
        this.stores = this.stores.slice(0, ix).concat(this.stores.slice(ix + 1))
        this.persistence.delete("store_" + name);
        this.selected.engine.flush();

        // delete all images associated with that notebook & also it's image list
        const images = ImageStore.getImageList(name)
        for (const image of images) {
            ImageStore.remove(image)
        }
        this.persistence.delete("imageList" + name)

        if (this.selectedIx == ix) {
            if (!this.stores.length) {
                this.newNotebook();
            }
            this.setSelectedIx(0)
        } else if (this.selectedIx > ix) {
            this.setSelectedIx(this.selectedIx - 1)
        }

        this.selected = this.stores[this.selectedIx][1]
        this._dispatchStoreListUpdated();

    }
}