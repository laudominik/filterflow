import React, { ReactNode, useState } from 'react';
import { Card, Button, Collapse } from 'react-bootstrap';
import { faChevronDown, faChevronUp} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface EntryHeaderProps {
    children: ReactNode;
}

interface EntryBodyProps {
    children: ReactNode;
}

interface EntryIconsProps {
    children: ReactNode;
}

interface EntryProps {
    children: ReactNode;
    color: string;
    invert?: boolean;
}

const EntryHeader: React.FC<EntryHeaderProps> = ({ children }) => {
    return <span>{children}</span>;
};

const EntryBody: React.FC<EntryBodyProps> = ({ children }) => {
    return <span>{children}</span>;
};

const EntryIcons: React.FC<EntryIconsProps> = ({ children }) => {
    return <span>{children}</span>;
};

const Entry: React.FC<EntryProps> & {
    Header: React.FC<EntryHeaderProps>;
    Body: React.FC<EntryBodyProps>;
    Icons: React.FC<EntryIconsProps>;
} = ({ children, color, invert=false }) => {
    const [open, setOpen] = useState(false);


    const style = {
        backgroundColor: color,
        color: invert ? "white" : "black"
    }

    const header = React.Children.toArray(children).find((child) => {
        return React.isValidElement(child) && child.type === EntryHeader;
    });

    const body = React.Children.toArray(children).find((child) => {
        return React.isValidElement(child) && child.type === EntryBody;
    });

    const icons = React.Children.toArray(children).find((child) => {
        return React.isValidElement(child) && child.type === EntryIcons;
    });

    return  <Card className="transformCard" style={style}>
    <Card.Header className="cardHeader">
        <div>
            <Button 
                className='border-0 bg-transparent'
                onClick={() => setOpen(!open)}
                aria-expanded={open}>
                <FontAwesomeIcon className="iconInCard" icon={open ? faChevronDown : faChevronUp} />
            </Button>
            {header} 
        </div>
       {icons}
    </Card.Header>
    <Collapse in={open}>
        <Card.Body>
            {body}
        </Card.Body>
    </Collapse>
</Card>
};

Entry.Header = EntryHeader;
Entry.Body = EntryBody;
Entry.Icons = EntryIcons;

export default Entry;

