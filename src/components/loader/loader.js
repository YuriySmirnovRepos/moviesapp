import React from 'react';
import { Spin } from 'antd';
import './loader.css';
import propTypes from 'prop-types';

function Loader({ isLoading, children }) {
  return (
    <Spin
      spinning={isLoading}
      size="large"
      className="loader"
      wrapperClassName="loader__wrapper"
    >
      {children}
    </Spin>
  );
}

export default Loader;

Loader.defaultProps = {
  isLoading: false,
  children: null,
};

Loader.propTypes = {
  isLoading: propTypes.bool,
  children: propTypes.node,
};
