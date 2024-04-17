import {Nav, Navbar, Tab, Tabs} from "react-bootstrap";
import { faFilm, faProjectDiagram, faTimeline } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DarkModeSwitch from "./DarkModeSwitch";
import EngineModeSwitch from "./EngineModeSwitch";
import TabsComponent from "./TabsComponent";
import FileComponent from "./FileComponent";

export default function BrandNavBar() {

    return <Navbar id="brandNav" className="brandNav">
                <Navbar.Brand className="p-3">
                    <FontAwesomeIcon icon={faFilm} />
                    FilterFlow
                </Navbar.Brand>
                <FileComponent />
                
                <Navbar.Collapse id="responsive-navbar-nav" style={{
                    overflowX: "auto",
                    whiteSpace: "nowrap"
                }}>
                    <TabsComponent />
                </Navbar.Collapse>
                <Nav className="me-auto"><DarkModeSwitch /></Nav>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                
           </Navbar>
  }