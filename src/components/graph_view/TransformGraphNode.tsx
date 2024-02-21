import { useContext, useState, useSyncExternalStore } from "react";
import { GUID } from "../../engine/engine";
import { Card, CardBody, CardHeader, CardTitle } from "react-bootstrap";
import { graphContext } from "../../stores/graphFilterStore";
import GraphNode from "./GraphNode";

export default function TransformGraphNode({ guid }: { guid: GUID }){

   return <GraphNode guid={guid}>
        <GraphNode.Body>body</GraphNode.Body>
    </GraphNode>
    
}