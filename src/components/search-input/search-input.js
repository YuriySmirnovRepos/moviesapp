import React from 'react';
import './search-input.css';
import { Input } from 'antd';
import propTypes from 'prop-types';

import Utils from '../../utils/utils';

const INPUT_DELAY_BEFORE_SEARCH = 800;

function SearchInput({ disabled, onInputChange, query }) {
  return (
    <Input
      disabled={disabled}
      placeholder="Type to search"
      onChange={Utils.debounce(onInputChange, INPUT_DELAY_BEFORE_SEARCH)}
      defaultValue={query}
      className="search-input"
    />
  );
}

export default SearchInput;

SearchInput.propTypes = {
  disabled: propTypes.bool,
  onInputChange: propTypes.func,
  query: propTypes.string,
};

SearchInput.defaultProps = {
  disabled: false,
  onInputChange: () => null,
  query: null,
};
