import declareOps from '../engine/TransformRegistration';
import { createContext } from "react";
import { GraphFilterStore } from "./graphFilterStore";
import { IConnectionStore, INodeStore, IPreviewStores, IPersistentStore } from "./storeInterfaces";
import { NotebookStore } from './notebookStore';

declareOps();
const notebookStore = new NotebookStore();
const graphStore = notebookStore.getSelected();
export const nodeStoreContext = createContext<INodeStore>(graphStore)
export const previewStoreContext = createContext<IPreviewStores>(graphStore)
export const connectionStoreContext = createContext<IConnectionStore>(graphStore);
export const persistenceContext = createContext<IPersistentStore>(graphStore); // TODO: remove this after migrating to Notebook store
export const notebookStoreContext = createContext(notebookStore);