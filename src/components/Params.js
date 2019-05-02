import React, { Component } from "react";

import { Select, Button, InputNumber } from "antd";
const Option = Select.Option;

class Params extends Component {
  state = {};
  componentDidMount() {
    this.setState({ mapSettings: this.props.mapSettings });
  }
  updateSetting = (key, value) => {
    /*
      this part is a little complicated, but basically when
      changing the value of a text field or a number input, you
      have to save the value as the state. so we make a local copy of
      the properties in componentDidMount, and then update them when
      the user types a new value. when the user clicks the button,
      that passes the local state of the settings back up to App.js,
      which then sends them down to Map.js as the new height and width

      this code is set up to:
      1) have a mapSettings {} obj of variable complexity and keep it
         as one settings object to send to the map
      2) wait until the user clicks the button to send new map attrs,
         vs. updating the map on each keypress from the input
    */
    let mapSettings = { ...this.state.mapSettings };
    mapSettings[key] = value;
    this.setState({ mapSettings });
  }
  render() {
    if (!this.state.mapSettings) return (null);

    const features = this.props.data;
    const keys = [];
    features.forEach(function(f) {
      const fprops = Object.keys(f.properties);
      fprops.forEach(fp => keys.push(fp));
    });
    const dedupe = [...new Set(keys)];

    const { width, height } = this.state.mapSettings;

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
          <InputNumber value={width} 
            onChange={e => this.updateSetting("width", e)}
          />
          <InputNumber value={height} 
            onChange={e => this.updateSetting("height", e)}
          />
        </span>
        <Button type="primary" 
          onClick={() => this.props.updateSettings(this.state.mapSettings)}
        >
          Set Parameters
        </Button>
      </div>
    );
  }
}

export default Params;