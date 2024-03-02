import { createContext } from "react";
import { GraphFilterStore } from "./graphFilterStore";
import { IConnectionStore, INodeStore, IPreviewStores } from "./storeInterfaces";

const graphStore = new GraphFilterStore()
export const nodeStoreContext = createContext<INodeStore>(graphStore)
export const previewStoreContext = createContext<IPreviewStores>(graphStore)
export const connectionStoreContext = createContext<IConnectionStore>(graphStore);