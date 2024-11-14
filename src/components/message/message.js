import React from 'react';
import { Alert } from 'antd';
import './message.css';
import propTypes from 'prop-types';

function Message({ error, isNoSearchResults }) {
  const nonErrorMessage = isNoSearchResults
    ? 'No search results'
    : 'No rated movies';
  const nonErrorDesc = isNoSearchResults
    ? 'Please, try another search'
    : 'You havent rated any movies yet';

  return (
    <Alert
      type={error ? 'error' : 'info'}
      banner
      message={error ? 'Loading error' : nonErrorMessage}
      description={error ? error.message : nonErrorDesc}
      showIcon
      className="message"
    />
  );
}

export default Message;

Message.defaultProps = {
  error: null,
  isNoSearchResults: false,
};

Message.propTypes = {
  error: propTypes.shape({ message: propTypes.string }),
  isNoSearchResults: propTypes.bool,
};
