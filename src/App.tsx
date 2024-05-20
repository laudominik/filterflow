import 'reflect-metadata'
import {useState, useEffect, StrictMode, useContext, useSyncExternalStore} from 'react';
import {Button, Tab} from 'react-bootstrap';
import {faList} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import BrandNavBar from './components/brand_nav_bar/BrandNavBar'
import PreviewContainer from './components/preview_container/PreviewContainer';
import TransformPipeline from './components/transform_pipeline/TransformPipeline';
import SplitPane from "./components/SplitPane";

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import GraphView from './components/graph_view/GraphView';
import {connectionStoreContext as ConnectionStoreContext, nodeStoreContext as NodeStoreContext, notebookStoreContext as NotebookStoreContext, previewStoreContext as PreviewStoreContext} from './stores/context';
import {useCommand, useKeybinds} from './util/commands';
import ShortcutSheet from './components/commands/ShotcutSheet';
import { CommandPalette } from './components/search/CommandPalette';

export default function App() {
  const notebookStore = useContext(NotebookStoreContext);
  const graphStore = useSyncExternalStore(notebookStore.subscribeSelected.bind(notebookStore), notebookStore.getSelected.bind(notebookStore));
  const [expanded, setExpanded] = useState(true);
  const [modeGraph, setModeGraph] = useState(false);

  // @ts-ignore
  window["notebook"] = notebookStore;

  function viewModeHandler() {
    let currentMode = sessionStorage.getItem("engineMode")
    currentMode = "graph"
    if (currentMode) {
      setModeGraph(currentMode === "graph")
    }
  }

  useEffect(() => {
    viewModeHandler()
    window.addEventListener('storage', viewModeHandler, false);
  }, [])

  useKeybinds();

  const notebooks = sessionStorage.getItem("notebooks");
  if (!notebooks) {
    sessionStorage.setItem("notebooks", '["New_notebook"]');
    sessionStorage.setItem("selectedTabIx", "0");
    sessionStorage.setItem("engines", '["{}"]')
  }

  const splitPane = (
    <SplitPane expanded={expanded}>
      <SplitPane.Left>
        <div className='resizableStyle'>
          <TransformPipeline setExpanded={setExpanded} />
        </div>
      </SplitPane.Left>
      <SplitPane.Right><div className='resizableStyle'><PreviewContainer /></div></SplitPane.Right>
    </SplitPane>
  )

  const expandButton = (
    <Button className="border-0 floatingButton" style={{
      borderRadius: '50%',
      backgroundColor: 'rgba(0,0,0, 0.5)'
    }}>
      <FontAwesomeIcon icon={faList} onClick={() => {setExpanded(true)}} />
    </Button>
  )

  // TODO: move down into separate compontent
  const [cpVis, setCpVis] = useState(false);

  useCommand({
    name: "force reload",
    callback: ()=>{window.localStorage.clear(); window.location.reload()}
  })

  const view = <GraphView />
  //const view = modeGraph ? <GraphView /> : <>{expanded ? <></> : expandButton} {splitPane}</>
  // TODO: get selected notebook
  return (
    <StrictMode>
      <NodeStoreContext.Provider value={graphStore}>
        <ConnectionStoreContext.Provider value={graphStore}>
          <PreviewStoreContext.Provider value={graphStore}>
            <div className="App">
              <BrandNavBar />
              <CommandPalette show={cpVis} setShow={setCpVis}/>
              {view}
            </div>
          </PreviewStoreContext.Provider>
        </ConnectionStoreContext.Provider>
      </NodeStoreContext.Provider>
    </StrictMode >
  );
}