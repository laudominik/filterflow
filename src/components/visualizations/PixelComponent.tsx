import { ReactNode } from 'react';
import './PixelComponent.css'
import { Channel } from '../../stores/simpleFilterStore';


function PixelComponent(color: [number, number, number], channel: Channel){
    let styleColor: string;
    let value = 0;

    switch (channel) {
        case Channel.RED:
            styleColor =`rgba(${color[0]}, 0, 0, 255)`
            value = color[0]
            break;
        case Channel.GREEN: 
            styleColor = `rgba(0, ${color[1]}, 0, 255)`
            value = color[1]
            break;
        case Channel.BLUE: 
            styleColor = `rgba(0, 0, ${color[2]}, 255)`
            value = color[2]
            break;
        case Channel.GRAY: 
            styleColor = `rgba(${color[0]}, ${color[0]}, ${color[0]}, 255)`
            value = color[0]
            break;
        case Channel.NONE:
            styleColor = `white`
            value = -1
    }

    return <div style={{backgroundColor: styleColor, color:"white"}} className="pixelComponent">{value}</div>
}

export function ColorComponent(color: number, channel: Channel){
    let styleColor: string;
    let value = color;

    switch (channel) {
        case Channel.RED:
            styleColor =`rgba(${color}, 0, 0, 255)`
            break;
        case Channel.GREEN: 
            styleColor = `rgba(0, ${color}, 0, 255)`
            break;
        case Channel.BLUE: 
            styleColor = `rgba(0, 0, ${color}, 255)`
            break;
        case Channel.GRAY: 
            styleColor = `rgba(${color}, ${color}, ${color}, 255)`
            break;
        case Channel.NONE:
            styleColor = `black`
    }

    return <div style={{backgroundColor: styleColor, color:"white"}} className="pixelComponent">{value}</div>
}

export default PixelComponent