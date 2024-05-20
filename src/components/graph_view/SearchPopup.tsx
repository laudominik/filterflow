import Fuse, { FuseResult, RangeTuple } from 'fuse.js'

import { knownTypes, transformType } from '../../engine/TransformDeclarations'
import { ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { nodeStoreContext } from '../../stores/context';
import { KeyboardEventKey } from '../../util/keys';
import '../search/CommonSearchStyle.css'
// Notes for mobile, and tablet version
//  - remember that it will open virtual keyboard (so we have even less screen space)
//  - since we have actually no screen size, search should fill entire screen

function SearchGroup({children, name}:{children?: ReactNode, name: string}){
  return <div className='search-group'>
    <div className='search-group-name'>{name}</div>
    {children}
  </div>
}

export default function SearchPopup({visible=true, setVisible, handleResultClick: onResultClick, position=[0,0]}:{visible?: boolean, setVisible: (_: React.SetStateAction<boolean>) => void, handleResultClick?: (name: string)=>void, position?: [number, number]}){
  
  const transformsPaths = useMemo(() => Array.from(transformType())
    .map(val => val[1].map(name=>{return {group: val[0], name, full: `${val[0]}/${name}`}}))
    .reduce((arr, val)=>{return arr.concat(val)}, []), [])

  const handleClose = ()=>{
    setVisible(false)
  };
  const fuse = useMemo(() => new Fuse(transformsPaths, {includeMatches: true, keys: ['full'], ignoreLocation: true, minMatchCharLength:1}), [transformsPaths])
  
  const nodeStore = useContext(nodeStoreContext)
  const [query, setQuery] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryResults = fuse.search(query);
  const [selected, setSelected] = useState(0);
  const [mouseSelected, setMouseSelected] = useState(0);
  const transformationList = useRef<HTMLDivElement>(null);

  const totalResults = query === "" ? transformsPaths.length : queryResults.filter(v => v.matches != null).length;


  useEffect(()=>{
    if(visible === true && inputRef.current != null){
      inputRef.current.focus();
      inputRef.current.select();
      setQuery("")
      setSelected(0)
    }
  }, [visible])

  useEffect(() => {
    const target : HTMLElement | undefined = transformationList.current?.querySelector('.selected')!;
    const y = target?.offsetTop;
    const height = transformationList.current?.clientHeight;
    if(!height) return;

    transformationList.current?.scrollTo({
        behavior: 'auto',
        top: y - height/2,
    })
}, [selected])

  const handleControls = (e: React.KeyboardEvent) => {
    if (e.key as KeyboardEventKey === "ArrowUp") {
      setSelected(selected - 1 < 0 ? totalResults - 1 : selected - 1)
      e.preventDefault();
      e.stopPropagation();

      return;
  }
  if (e.key as KeyboardEventKey === "ArrowDown") {
      setSelected(selected + 1 >= totalResults ? 0 : selected + 1)
      e.preventDefault();
      e.stopPropagation();
  }
  if (e.key as KeyboardEventKey === "Enter") {
      if (query === "") {
          handleSelect(transformsPaths[selected].name)
      } else {
          const name = queryResults.filter(v => v.matches != null)[selected].item.name;
          handleSelect(name);
      }
      handleClose();
      e.preventDefault();
      e.stopPropagation();
  }
  if(e.key as KeyboardEventKey === 'Escape'){
    handleClose();
    e.stopPropagation();
    e.stopPropagation();
  }
  }

  
  const defaultResult = ()=>{
    let i = -1;
    return <>
      {Array.from(transformType()).map(v => {
        const [groupName, elements] = v;
       return <SearchGroup key={groupName} name={groupName}>
          {

            elements.map((name)=>{
              i += 1;
              return <div className={'search-result' + (selected === i ? ' selected' : '') + (mouseSelected === i ? ' mouseSelected' : '')} key={name} onClick={() => {handleSelect(name)}} onMouseOver={() => {setMouseSelected(i)}}>{name}</div>
            })

          }
        </SearchGroup>
    })}
    </>
  }

  const searchResult = ()=>{
    return <>
      {queryResults.map((result, i) => {
        if(!result.matches) return <></>
        const matches = new Map(result.matches.map(value => [value.key, value]));
        const fullMatch = matches.has('full') ? matches.get('full')?.indices : [];
        
        return <div className={'search-result' + (selected === i ? ' selected' : '') + (mouseSelected === i ? ' mouseSelected' : '')} key={result.item.name} onClick={() => {handleSelect(result.item.name)}} onMouseOver={() => {setMouseSelected(i)}}>
        {highlightMatches(result.item.full, fullMatch)}
        </div>
      })}
    </>
  }


  //#region EventHandlers
  const handleSearch = (e: React.ChangeEvent)=>{
    const value = (e.target as HTMLInputElement).value;
    setQuery(value);
    setSelected(0);

  }

  const handleSelect = (name : string) =>{
    // TODO [accessability]: focus on newly added element
    nodeStore.addTransform(name, {position: {x: position[0], y: position[1]}, previewPosition: {x: position[0] - 10, y: position[1] - 10}});
    onResultClick?.(name);
  }

  const handleArrowSelect = (e : React.KeyboardEvent)=>{

  }
  //#endregion


  return !visible ? <></> : <div style={{top: `50%`, left: `50%`, position: "absolute", zIndex: 110 }} className='search-popup' onKeyDown={handleArrowSelect} onMouseDown={(e) => {e.stopPropagation()}}>
    <input onChange={handleSearch} onKeyDown={handleControls} ref={inputRef}/>
    <div className='search-result-list' onWheel={(e) => e.stopPropagation()} ref={transformationList}>
    {query === "" ? defaultResult() : searchResult()}
  </div>
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