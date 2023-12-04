import React, { ReactNode, useEffect } from "react";
import { useState, useRef } from "react";

import "./SplitPane.css";
import { execPath } from "process";

interface SplitPaneComponentProps {
  children: ReactNode;
}

interface SplitPaneProps {
  children: ReactNode;
  expanded: boolean;
}

const SplitPaneRight: React.FC<SplitPaneComponentProps> = ({ children }) => {
  return <>{children}</>;
};

const SplitPaneLeft: React.FC<SplitPaneComponentProps> = ({ children }) => {
  return <>{children}</>;
};

const SplitPane: React.FC<SplitPaneProps> & {
  Left: React.FC<SplitPaneComponentProps>;
  Right: React.FC<SplitPaneComponentProps>;
} = ({ children, expanded }) => {
  const left = React.Children.toArray(children).find((child) => {
    return React.isValidElement(child) && child.type === SplitPaneLeft;
  });

  const right = React.Children.toArray(children).find((child) => {
    return React.isValidElement(child) && child.type === SplitPaneRight;
  });

  const sidebarRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(expanded ? 268 : 0);
  
  useEffect(()  => {
    setSidebarWidth(expanded ? 268 : 0);
  }, [expanded]);

  const startResizing = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        setSidebarWidth(
          mouseMoveEvent.clientX -
          // @ts-ignore
            sidebarRef.current.getBoundingClientRect().left
        );
      }
    },
    [isResizing]
  );

  React.useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="app-container">
      <div
        ref={sidebarRef}
        className={expanded ? "app-sidebar" : ""}
        style={{ width: sidebarWidth, height:'100%' }}
      >
        <div className="app-sidebar-content">
            {left}
        </div>
        <div className="app-sidebar-resizer" onMouseDown={startResizing}>
        </div>
      </div>
      <div className="app-frame">
        {right}
      </div>

    </div>
  );
}

SplitPane.Left = SplitPaneLeft;
SplitPane.Right = SplitPaneRight;

export default SplitPane;