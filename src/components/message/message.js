import React from "react";
import { Alert } from "antd";
import "./message.css";

const Message = ({ error, isNoSearchResults }) => {
  
  const nonErrorMessage = isNoSearchResults
    ? "No search results"
    : "No rated movies";
  const nonErrorDesc = isNoSearchResults
    ? "Please, try another search"
    : "You haven't rated any movies yet";

  return (
    <Alert
      type={error ? "error" : "info"}
      banner
      message={error ? "Loading error" : nonErrorMessage}
      description={error ? error.message : nonErrorDesc}
      showIcon
      className="message"
    />
  );
};

export default Message;
