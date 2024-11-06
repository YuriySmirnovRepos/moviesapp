import React from "react";
import { Spin } from "antd";
import "./loader.css";

const Loader = ({ isLoading, children }) => {
  return (
      <Spin spinning={isLoading} size="large" className="loader" wrapperClassName="loader__wrapper">
        {children}
      </Spin>
  );
};

export default Loader;
