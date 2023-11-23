import React, { useContext, ReactNode, KeyboardEvent, useSyncExternalStore, useState } from 'react';
import { Card, ListGroup, Col, Row, Tab } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import SplitPane from '../../SplitPane';
import { FilterStoreContext } from '../../../stores/simpleFilterStore';

import "./AddTransformModal.css"

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


function TransformsType(name:string, color:string, transforms: string[] = []): TransformsTypeIfc{
  const id = "#" + name;
  const filterStore = useContext(FilterStoreContext);
  // TODO: call to engine to get all registered transforms of the type 
  // TODO: call to engine to get color assigned to the transform of the type 

  const onClickHandler = () => {
    // TODO: should check the name of the clicked transformation and add a proper one
    filterStore.addTransform("custom_kernel")
  };

  return {
    name: name,
    typeCard: <ListGroup.Item action href={id} style={{backgroundColor: color}}> {name} </ListGroup.Item>,
    typeList: <Tab.Pane eventKey={id}>
      <ListGroup>
        {transforms.map(transform => 
          <ListGroup.Item style={{backgroundColor: color}} onClick={onClickHandler}>
            {transform}
          </ListGroup.Item>)}
      </ListGroup>
    </Tab.Pane>
  }
}

function LinearTransforms(){
  return TransformsType("Linear", "#E6F4E2", [
    "Laplace filter", 
    "Gaussian blur", 
    "Sobel filter", 
    "Custom kernel"
  ]);
}

function PoolingTransforms(){
  return TransformsType("Pooling", "#E2E7F4", [
    "Max pooling",
    "Min pooling",
    "Avg pooling"
  ]);
}

function LogicalTransforms(){
  return TransformsType("Logical", "#E2F0F4", [
    "And",
    "Or",
    "Xor"
  ]);
}

function PointTransforms(){
  return TransformsType("Point", "#F4E2F4", [
    "Brightness",
    "Threshold",
    "To grayscale",
    "To YCbCr"
  ]);
}

function MorphologicTransforms(){
  return TransformsType("Morphologic", "#F2F4E2", [
    "Erosion",
    "Dilatation"
  ]);
}