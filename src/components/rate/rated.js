import React from "react";
import "./rated.css";
import { Rate as AntdRate } from "antd";

export default class Rate extends React.Component {

  render() {
    const  {setRating, value}  = this.props;
    return (
      <AntdRate
        allowHalf
        count={10}
        value={value}
        onChange={(value) => {
          setRating(value);
        }}
        className="card__rate"
      />
    );
  }
}
