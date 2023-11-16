import BrandNavBar from './components/brand_nav_bar/BrandNavBar'
import PreviewContainer from './components/preview_container/PreviewContainer';
import TransformPipeline from './components/transform_pipeline/TransformPipeline';
import SplitPane from "./components/SplitPane";

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  const splitPane = (  
    <SplitPane>
      <SplitPane.Left><div className='resizableStyle'><TransformPipeline/></div></SplitPane.Left>
      <SplitPane.Right><div className='resizableStyle'><PreviewContainer/></div></SplitPane.Right>
    </SplitPane> 
  )

  return (
      <div className="App">
        <BrandNavBar />
        {splitPane}
      </div>   
  );
}