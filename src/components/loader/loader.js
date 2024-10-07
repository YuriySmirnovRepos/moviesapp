import React, { Children } from "react";
import { Spin } from "antd";

const Loader = ({ isLoading, children }) => {
  return (
    <Spin spinning={isLoading} size="large" style={{ height: 0, top: "50%" }}>
      {children}
    </Spin>
  );
};

export default Loader;
