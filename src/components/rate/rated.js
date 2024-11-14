import React from 'react';
import './rated.css';
import { Rate as AntdRate } from 'antd';
import propTypes from 'prop-types';

export default function Rate({ setRating, value }) {
  return (
    <AntdRate
      allowHalf
      count={10}
      value={value}
      onChange={(ratingValue) => {
        setRating(ratingValue);
      }}
      className="card__rate"
    />
  );
}

Rate.propTypes = {
  setRating: propTypes.func,
  value: propTypes.number,
};

Rate.defaultProps = {
  setRating: () => {},
  value: 0,
};
