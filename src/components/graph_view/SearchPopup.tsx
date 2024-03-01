import Fuse, { FuseResult, RangeTuple } from 'fuse.js'

import { knownTypes, transformType } from '../../engine/TransformDeclarations'
import { ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { nodeStoreContext } from '../../stores/context';

// Notes for mobile, and tablet version
//  - remember that it will open virtual keyboard (so we have even less screen space)
//  - since we have actually no screen size, search should fill entire screen

function SearchResult({children}:{children?: ReactNode}){
  // `size` attribute for `select` is not supported for mobile
  // that's why we are implementing <select> from scratch
  return <div className='search-result-list' onWheel={(e) => e.stopPropagation()}>
    {children}
  </div>
}

function SearchGroup({children, name}:{children?: ReactNode, name: string}){
  return <div className='search-group'>
    <div className='search-group-name'>{name}</div>
    {children}
  </div>
}

function SearchEntry({children, name, onClick}:{children? : ReactNode, name: string, onClick? : (name: string)=>void}) {
  return <div className='search-result' onClick={() => {onClick?.(name)}}>
    {children}
  </div>
}

export default function SearchPopup({visible=true, handleResultClick: onResultClick, position=[0,0]}:{visible?: boolean, handleResultClick?: (name: string)=>void, position?: [number, number]}){
  
  // TODO: add keyboard arrows support
  // QoL, onEnter select first element
  // what about 2D list instead? check

  //#region TODO: figure out if react re-calculate this, or expose that
  const transformsPaths = Array.from(transformType())
    .map(val => val[1].map(name=>{return {group: val[0], name, full: `${val[0]}/${name}`}}))
    .reduce((arr, val)=>{return arr.concat(val)}, []).concat({group: "source", name: "source", full:"source"});

  const fuse = new Fuse(transformsPaths, {includeMatches: true, keys: ['full'], ignoreLocation: true, minMatchCharLength:1})
  //#endregion
  
  const nodeStore = useContext(nodeStoreContext)
  const [query, setQuery] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryResults = fuse.search(query);

  useEffect(()=>{
    if(visible === true && inputRef.current != null){
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [visible])
  
  const defaultResult = ()=>{
    return <SearchResult>
      {Array.from(transformType()).map(v => {
        const [groupName, elements] = v;
       return <SearchGroup key={groupName} name={groupName}>
          {
            elements.map((name)=>{
              return <SearchEntry key={name} name={name} children={name} onClick={handleSelect}/>
            })

          }
        </SearchGroup>
    })}
    </SearchResult>
  }

  const searchResult = ()=>{
    return <SearchResult>
      {queryResults.map(result => {
        if(!result.matches) return <></>
        const matches = new Map(result.matches.map(value => [value.key, value]));
        const fullMatch = matches.has('full') ? matches.get('full')?.indices : [];
        return <SearchEntry key={result.item.name} name={result.item.name} onClick={handleSelect}>{highlightMatches(result.item.full, fullMatch)}</SearchEntry>
      })}
    </SearchResult>
  }


  //#region EventHandlers
  const handleSearch = (e: React.ChangeEvent)=>{
    const value = (e.target as HTMLInputElement).value;
    setQuery(value);
  }

  const handleSelect = (name : string) =>{
    nodeStore.addTransform(name, {position: {x: position[0], y: position[1]}, previewPosition: {x: position[0] - 10, y: position[1] - 10}});
    onResultClick?.(name);
  }

  const handleArrowSelect = (e : React.KeyboardEvent)=>{

  }
  //#endregion


  return <div style={{top: `50%`, left: `50%`, position: "absolute", zIndex: 110, visibility: visible ? "visible" : "hidden" }} className='search-popup' onKeyDown={handleArrowSelect} onMouseDown={(e) => {e.stopPropagation()}}>
    <input onChange={handleSearch} ref={inputRef}/>
    {query === "" ? defaultResult() : searchResult()}
  </div>
}

// from https://gist.github.com/evenfrost/1ba123656ded32fb7a0cd4651efd4db0
export const highlightMatches = (inputText: string, regions: ReadonlyArray<RangeTuple> = []) => {
    const children: React.ReactNode[] = [];
    let nextUnhighlightedRegionStartingIndex = 0;
  
    regions.forEach((region, i) => {
      const lastRegionNextIndex = region[1] + 1;
  
      children.push(
        ...[
          inputText.substring(nextUnhighlightedRegionStartingIndex, region[0]).replace(' ', '\u00A0'),
          <span key={region + ' ' + i} className='fuse-highlight'>
            {inputText.substring(region[0], lastRegionNextIndex).replace(' ', '\u00A0')}
          </span>,
        ]
      );
  
      nextUnhighlightedRegionStartingIndex = lastRegionNextIndex;
    });
  
    children.push(inputText.substring(nextUnhighlightedRegionStartingIndex).replace(' ', '\u00A0'));
  
    return <>{children}</>;
  };