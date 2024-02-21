import Fuse, { FuseResult, RangeTuple } from 'fuse.js'

import { knownTypes, transformType } from '../../engine/TransformDeclarations'
import { ReactNode, useContext, useEffect, useState } from 'react';
import Transform from '../../engine/Transform';
import { graphContext } from '../../stores/graphFilterStore';


/*
DESIGN NOTES:
- the result don't need not be reactive (performance?)
*/

/*
    There will be at least 4 search components (graph popup, transform modal, help, and perhaps command pallete)
    Either there will be a common something, or 4 different versions to maintain

    What I'm thinking:

    +----------------+
    |  [Search Bar]  |
    +----------------+
    | Res1           |
    | Res2           |
    | Group>         |
    +----------------+

    The stylling will differ
    The search bar action won't (it's always the same)
    The result entries (content, and action) will differ
    The dataset will differ along with search options (i.e. top 5, search fields)

    An unified thing would actually only:
    - create Fuse
    - create search bar
    - map search results
    - handle when search pattern is empty

    Creating fuse is a one line
    Search bar is a one element + 3 lines of search function
    Mapping is a one function

    Only highlighting is a pain

    Pros:
    - We split logic

    Cons:
    - Form over content?
*/


// give default list from start
export default function SearchPopup({visible=true, position=[0,0]}:{visible?: boolean, position?: [number, number]}){
  const graphStore = useContext(graphContext)
  const [pattern, setPattern] = useState<string>("")

  const list = Array.from(transformType())
    .map(val => val[1].map(name=>{return {group: val[0], name, full: `${val[0]}/${name}`}}))
    .reduce((arr, val)=>{return arr.concat(val)}, []).concat({group: "", name: "source", full:"source"})

  const fuse = new Fuse(list, {includeMatches: true, keys: ['full'], ignoreLocation: true, minMatchCharLength:1})

  function handleAddTransform(name: string){
    graphStore.addTransform(name)
  }

  function handleSearch(e: React.ChangeEvent){
    const value = (e.target as HTMLInputElement).value
    setPattern(value)
  }

  function preventPropagation(e: React.SyntheticEvent){
    e.stopPropagation()
  }

  function searchResult(result: ReactNode, name: string): ReactNode{
    return <div className='search-result' onClick={()=> {handleAddTransform(name)}}>{result}</div>
  }

  function searchResults(value: string){
    return <div className='search-result-list' onWheel={preventPropagation}>{fuse.search(value).map(result => {
      if(!result.matches) return <></>

      let matches = new Map(result.matches.map(value => [value.key, value]))
      let fullMatch = matches.has('full') ? matches.get('full')!.indices : []
      // TODO: tune search logic (handle searching by group specific, and both at the same time)

      return searchResult(highlightMatches(result.item.full, fullMatch), result.item.name)
    })}</div>
  }

  function defaultResult(){
    return <div className='search-result-list'  onWheel={preventPropagation}>{list.map(el => searchResult(el.full, el.name))}</div>
  }

  return <div style={{top: `50%`, left: `50%`, position: "absolute", zIndex: 110, visibility: visible ? "visible" : "hidden" }} className='search-popup' onClick={preventPropagation}>
    <input onChange={handleSearch}/>
    {pattern === "" ? defaultResult():searchResults(pattern)}
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