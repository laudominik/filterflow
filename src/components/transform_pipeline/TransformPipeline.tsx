import { useContext, useState, useSyncExternalStore } from 'react'
import TransformEntry from "./TransformEntry";
import { faList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button, Card} from 'react-bootstrap';
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend';
import ImportEntry from "./ImportEntry";
import FilterTransform from '../../engine/transforms/FilterTransform';
import Transform from '../../engine/Transform';
import MaxPoolingTransform from '../../engine/transforms/MaxPoolingTransform';

import "./Pipeline.css"
import AddTransformModal from './modal/AddTransformModal';
import { FilterStoreContext } from '../../stores/simpleFilterStore';
import { GUID } from '../../engine/nodeResponse';

export default function TransformPipeline(){
    const filterStore = useContext(FilterStoreContext);
    const sequence = useSyncExternalStore(filterStore.subscribeSequence.bind(filterStore), filterStore.getSequence.bind(filterStore));
    const transforms = filterStore.getTransforms(sequence);

    const moveTransform = (dragIndex: number, hoverIndex: number) => {
        filterStore.rearrange(dragIndex ,hoverIndex);
    };
    const transformList = sequence.map((_, index) => (
        <TransformEntryDraggable
          key={index}
          transform={transforms[index]}
          index={index}
          moveTransform={moveTransform}
        />
      ));

    return <div className="transformPipeline">
        <div className="pipelineBar">
            <div> Pipeline </div>
            <Button className="border-0 bg-transparent">
                <FontAwesomeIcon className="iconInCard" icon={faList} />
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

function TransformEntryDraggable({transform, index, moveTransform} 
    : { 
        transform: Transform, 
        index: number, 
        moveTransform: (fromIndex: number, toIndex: number) => void 
    }){
        const [, drag] = useDrag({
            type: 'ITEM',
            item: { index },
          });
        const [, drop] = useDrop({
            accept: 'ITEM',
            hover: (item: any) => {
                if (item.index !== index) {
                  moveTransform(item.index, index);
                  item.index = index;
                }
              },
        });
        return <div ref={(node) => drag(drop(node))}>
            <TransformEntry transform={transform}/>
        </div>
    }
