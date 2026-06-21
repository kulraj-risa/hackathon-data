import React from "react";
import ConfigurationBrowser from "./ConfigurationBrowser";
import "./documentsToAttach.scss";

const DocumentsToAttach: React.FC = () => {
  return (
    <div className="documents-to-attach">
      <div className="configuration-browser-container">
        <ConfigurationBrowser />
      </div>
    </div>
  );
};

export default DocumentsToAttach;
