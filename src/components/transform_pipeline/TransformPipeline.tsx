import TransformEntry from "./TransformEntry";
import { faList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Button, Card} from 'react-bootstrap';
import ImportEntry from "./ImportEntry";
import FilterTransform from '../../engine/transforms/FilterTransform';


export default function TransformPipeline(){
    const transformList = <div>
        <TransformEntry transform={new FilterTransform}/>
    </div>

    return <div className="transformPipeline">
        <div className="pipelineBar">
            <div> Pipeline </div>
            <Button className="border-0 bg-transparent">
                <FontAwesomeIcon className="iconInCard" icon={faList} />
            </Button>
        </div>
        <div>
            <ImportEntry />
            {transformList}
            {addEntry()}
        </div>
        
    </div>
}

function addEntry(){
    // TODO: modal for adding transformations
    return <Card className="transformCard bg-black">
        <Card.Header className="cardHeader">
            <div className="text-center d-inline-block w-100 text-white">+</div>  
        </Card.Header>
    </Card>
}

