import React from "react";
import "./search-input.css";
import { Input } from "antd";
import Utils from "../../utils/utils";

const INPUT_DELAY_BEFORE_SEARCH = 800;

const SearchInput = ({ disabled, onInputChange, query }) => {
  return (
    <Input
      ref={(input) => input && input.focus()}
      disabled={disabled}
      placeholder="Type to search"
      onChange={Utils.debounce(onInputChange, INPUT_DELAY_BEFORE_SEARCH)}
      defaultValue={query}
      style={{ height: "40px", fontSize: "16px", marginBottom: "40px" }}
    />
  );
};

export default SearchInput;
