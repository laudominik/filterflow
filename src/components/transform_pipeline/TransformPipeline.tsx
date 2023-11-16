import { useState } from 'react'
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

export default function TransformPipeline(){
    const [transforms, setTransforms] = useState([new FilterTransform, new MaxPoolingTransform])

    const moveTransform = (dragIndex: number, hoverIndex: number) => {
        const newItems = [...transforms];
        const draggedItem = newItems[dragIndex];

        newItems.splice(dragIndex, 1);
        newItems.splice(hoverIndex, 0, draggedItem);
        setTransforms(newItems);
    };

    const transformList = transforms.map((transform, index) => (
        <TransformEntryDraggable
          key={index}
          transform={transform}
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
            <AddEntry />
        </div>
        
    </div>
}

function AddEntry(){
    // TODO: modal for adding transformations
    return <Card className="transformCard bg-black">
        <Card.Header className="cardHeader">
            <div className="text-center d-inline-block w-100 text-white">+</div>  
        </Card.Header>
    </Card>
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
