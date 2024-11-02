import React from "react";
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
        style={{
          fontSize: "15px",
          marginTop: "auto",
          height: "46px",
          textAlign: "center",
          alignContent: "center",
          flexShrink: 0,
        }}
      />
    );
  }
}
