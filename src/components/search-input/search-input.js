import React from "react";
import "./search-input.css";
import { Input } from "antd";
import Utils from "../../utils/utils";

const INPUT_DELAY_BEFORE_SEARCH = 800;

const SearchInput = ({ disabled, onInputChange, query }) => {
  return (
    <Input
      disabled={disabled}
      placeholder="Type to search"
      onChange={Utils.debounce(onInputChange, INPUT_DELAY_BEFORE_SEARCH)}
      defaultValue={query}
      className="search-input"
    />
  );
};

export default SearchInput;
