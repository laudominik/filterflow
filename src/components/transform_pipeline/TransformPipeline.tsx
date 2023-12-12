import { useContext, useState, useSyncExternalStore } from 'react'
import TransformEntry from "./TransformEntry";
import { faList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button, Card} from 'react-bootstrap';
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend';
import ImportEntry from "./ImportEntry";
import AddTransformModal from './modal/AddTransformModal';
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import { GUID } from '../../engine/nodeResponse';

import "./Pipeline.css"

export default function TransformPipeline({setExpanded}: {setExpanded: (arg0: boolean) => void}){
    const filterStore = useContext(FilterStoreContext);
    const sequence = useSyncExternalStore(filterStore.subscribeSequence.bind(filterStore), filterStore.getSequence.bind(filterStore));

    const moveInSequence = (dragIndex: number, hoverIndex: number) => {
        filterStore.rearrange(dragIndex ,hoverIndex);
    };
    const transformList = sequence.map((guid, index) => (
        <TransformEntryDraggable
          key={index}
          guid={guid}
          index={index}
          move={moveInSequence}
        />
      ));

    return <div className="transformPipeline overflow-auto">
        <div className="pipelineBar">
            <div> Pipeline </div>
            <Button className="border-0 bg-transparent">
                <FontAwesomeIcon className="iconInCard" icon={faList} onClick={() => {setExpanded(false)}}/>
            </Button>
        </div>
        <div>
            <ImportEntry />
            <DndProvider backend={HTML5Backend}>
            {transformList}
            </DndProvider>
            <AddTransformModal/>
        </div>
    </div>
}

function TransformEntryDraggable({guid, index, move} 
    : { 
        guid: GUID, 
        index: number, 
        move: (fromIndex: number, toIndex: number) => void 
    }){
        const [, drag] = useDrag({
            type: 'ITEM',
            item: { index },
          });
        const [, drop] = useDrop({
            accept: 'ITEM',
            hover: (item: any) => {
                if (item.index !== index) {
                  move(item.index, index);
                  item.index = index;
                }
              },
        });
        return <div key={guid} ref={(node) => drag(drop(node))}>
            <TransformEntry guid={guid}/>
        </div>
    }
