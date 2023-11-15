import {Nav, Navbar} from "react-bootstrap";
import { faFilm } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function BrandNavBar() {
    return <Navbar expand="lg" className="brandNav">
                <Navbar.Brand className="p-3">
                    <FontAwesomeIcon icon={faFilm} />
                </Navbar.Brand>
                <Navbar.Brand>
                    FilterFlow
                </Navbar.Brand>
           </Navbar>
  }