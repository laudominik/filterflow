import {Nav, Navbar} from "react-bootstrap";
import { faFilm, faProjectDiagram, faTimeline } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DarkModeSwitch from "./DarkModeSwitch";

export default function BrandNavBar() {
    return <Navbar expand="lg" className="brandNav">
                <Navbar.Brand className="p-3">
                    <FontAwesomeIcon icon={faFilm} />
                </Navbar.Brand>
                <Navbar.Brand>
                    FilterFlow
                </Navbar.Brand>
                <Navbar.Collapse className="justify-content-end navModeBar">
                    <div className="navModeButton" title="Linear (Pipeline) View">
                        {/* linear mode */}
                        <FontAwesomeIcon icon={faTimeline}/>
                    </div>
                    <div className="navModeButton" title="Graph View">
                        {/* graph mode */}
                        <FontAwesomeIcon icon={faProjectDiagram}/>
                    </div>
                    <DarkModeSwitch />
                </Navbar.Collapse>
           </Navbar>
  }