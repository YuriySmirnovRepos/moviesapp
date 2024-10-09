import React from "react";
import { Rate as AntdRate } from "antd";

export default class Rate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 0,
    };
  }


  render() {
    const  {setRating, value}  = this.props;
    return (
      <AntdRate
        allowHalf
        count={10}
        value={this.state.value}
        onChange={() =>{console.log();
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
