import Fuse, { FuseResult, RangeTuple } from 'fuse.js'

import { knownTypes } from '../../engine/TransformDeclarations'
import { ReactNode, useEffect, useState } from 'react';
import Transform from '../../engine/Transform';


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


function searchResult(transform: new ()=> Transform, element: ReactNode): ReactNode{
  return <div className='search-result'>{element}</div>
}

// give default list from start
export default function SearchPopup(){
  const [pattern, setPattern] = useState<string>("")
  const list = Array.from(knownTypes().values());
  const fuse = new Fuse(list, {includeMatches: true, keys: ['name']})

  function handleSearch(e: React.ChangeEvent){
    const value = (e.target as HTMLInputElement).value
    setPattern(value)
  }

  function preventPropagation(e: React.SyntheticEvent){
    e.stopPropagation()
  }

  function searchResults(value: string){
    return <div className='search-result-list' onWheel={preventPropagation}>{fuse.search(value).map(result => {
      if(!result.matches) return <></>

      let match = result.matches[0]
      return searchResult(result.item, highlightMatches(match.value!, match.indices))
    })}</div>
  }

  function defaultResult(){
    return <div className='search-result-list'  onWheel={preventPropagation}>{list.map(el => searchResult(el, el.name))}</div>
  }

  return <div style={{top: "50%", left: "50%", position: "absolute", zIndex: 110}} className='search-popup'>
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