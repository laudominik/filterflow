import './App.css';
import BrandNavBar from './components/brand_nav_bar/BrandNavBar'
import PreviewContainer from './components/preview_container/PreviewContainer';
import TransformPipeline from './components/transform_pipeline/TransformPipeline';
import SplitPane from 'react-split-pane'; 
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  const splitPane = (
    // @ts-ignore
    <SplitPane split="vertical" className='splitPane' minSize={50} size={80}>
        <div className='resizableStyle'><TransformPipeline/></div>
        <div className='resizableStyle'><PreviewContainer/></div>
    </SplitPane> 
  )

  return (
      <div className="App">
        <BrandNavBar />
        {splitPane}
      </div>   
  );

}
