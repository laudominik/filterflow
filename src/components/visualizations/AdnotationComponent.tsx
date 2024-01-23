import { ReactElement } from "react";

export type AdnotationPosition = "over" | "under"
export default function AdnotateElement(element: ReactElement, adnotation: string, position: AdnotationPosition = "over"){
    return <ruby style={{rubyPosition: position}}>{element}<rt>{adnotation}</rt></ruby>
}

export function AdnotateText(element: string, adnotation: string, position: AdnotationPosition = "over"){
    return <ruby style={{rubyPosition: position}}>{element}<rt>{adnotation}</rt></ruby>
}