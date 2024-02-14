import React, { useContext, ReactNode, KeyboardEvent, useSyncExternalStore, useState } from 'react';
import { Card, ListGroup, Col, Row, Tab } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import SplitPane from '../../SplitPane';
import { FilterStoreContext } from '../../../stores/simpleFilterStore';

import "./AddTransformModal.css"
import { getLinear, getLogical, getMorphologic, getPoint, getPooling } from '../../../engine/TransformDeclarations';

export default function AddTransformModal() {
  const [show, setShow] = useState(false);

  const typeList: TransformsTypeIfc[] = [
    LinearTransforms(), 
    PoolingTransforms(),
    LogicalTransforms(),
    PointTransforms(),
    MorphologicTransforms()
  ];

  return (
    <>
      <Card className="transformCard bg-black" onClick={() => setShow(true)} style={{cursor: "pointer"}}>
        <Card.Header className="cardHeader">
            <div className="text-center d-inline-block w-100 text-white">
              +
            </div>  
        </Card.Header>
      </Card>
      <Modal
        show={show}
        onHide={() => setShow(false)}
        contentClassName="rounded-0"
        aria-labelledby="example-custom-modal-styling-title"
      >
      <Modal.Header style={{paddingBottom: "0.5em", paddingTop: "0.5em"}}>
        Add transformation
      </Modal.Header>
      <Modal.Body>
        <Tab.Container id="list-group-tabs-example">
          <Row>
            <Col sm={4}>
              <ListGroup>
                {typeList.map(typeComponent => typeComponent.typeCard)}
              </ListGroup>
            </Col>
            <Col sm={8}>
              <Tab.Content>
                {typeList.map(typeComponent => typeComponent.typeList)}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Modal.Body>
      </Modal>
    </>
  );
}

interface TransformsTypeIfc {
  name: string;
  typeCard: ReactNode;
  typeList: ReactNode;
}


function TransformsType(name:string, color:string, bgColor:string, transforms: string[] = []): TransformsTypeIfc{
  const id = "#" + name;
  const filterStore = useContext(FilterStoreContext);
  // TODO: call to engine to get all registered transforms of the type 
  // TODO: call to engine to get color assigned to the transform of the type 

  const onClickHandler = (transform: string) => {
    // TODO: should check the name of the clicked transformation and add a proper one
    filterStore.addTransform(transform)
    filterStore.applyTransforms()
  };

  return {
    name: name,
    typeCard: <ListGroup.Item action href={id} style={{backgroundColor: bgColor, color: color}}> {name} </ListGroup.Item>,
    typeList: <Tab.Pane eventKey={id}>
      <ListGroup>
        {transforms.map(transform => 
          <ListGroup.Item style={{backgroundColor: bgColor, color: color}} onClick={() => onClickHandler(transform)}>
            {transform}
          </ListGroup.Item>)}
      </ListGroup>
    </Tab.Pane>
  }
}

function LinearTransforms(){
  return TransformsType("Linear", "black", "#E6F4E2", getLinear());
}

function PoolingTransforms(){
  return TransformsType("Pooling", "black", "#E2E7F4", getPooling());
}

function LogicalTransforms(){
  return TransformsType("Bitwise", "black", "#E2F0F4", getLogical());
}

function PointTransforms(){
  return TransformsType("Point", "black", "#F4E2F4", getPoint());
}

function MorphologicTransforms(){
  return TransformsType("Morphologic", "black", "#F2F4E2", getMorphologic());
}