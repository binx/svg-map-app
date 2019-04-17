import React, { Component } from "react";

import { Select, Button, InputNumber } from "antd";
const Option = Select.Option;

class Params extends Component {
  state = {};

  render() {
    const features = this.props.data;
    const keys = [];
    features.forEach(function(f) {
      const fprops = Object.keys(f.properties);
      fprops.forEach(fp => keys.push(fp));
    });
    const dedupe = [...new Set(keys)];

    return (
      <div>
        <Select name="thisID" style={{ width: 120 }}>
          {dedupe.map((k, i) => (
            <Option value={k} key={`option${i}`}>
              {k}
            </Option>
          ))}
        </Select>
        <span>
          <InputNumber />
          <InputNumber />
        </span>
        <Button type="primary" htmlType="submit">
          Set Parameters
        </Button>
      </div>
    );
  }
}

export default Params;
