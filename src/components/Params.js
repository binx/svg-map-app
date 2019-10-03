import React, { Component } from "react";

import { Button, InputNumber, Select, Checkbox } from "antd";

const { Option } = Select;

class Params extends Component {
  state = {};
  componentDidMount() {

    this.setState({ projections: ["mercator","orthographic","azimuthalEqualArea","azimuthalEquidistant","conicEqualArea","conicEquidistant","equirectangular"]}) 

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
    if (!this.state.mapSettings || !this.props.features.length) return (null);

    const { width, height, proj } = this.state.mapSettings;
    const { projections = []} = this.state;
    return (
      <div className="params">
        <span>
          <span>Width:</span>
          <InputNumber
            style={{ margin: "0 10px" }}
            value={width} 
            onChange={e => this.updateSetting("width", e)}
          />
          <span>Height:</span>
          <InputNumber
            style={{ margin: "0 10px" }}
            value={height} 
            onChange={e => this.updateSetting("height", e)}
          />
        </span>
         <Select defaultValue="mercator" style={{ width: 120 }} onChange={p =>this.updateSetting("proj", p)}>
            {projections.map(p => {
            return <Option value = {p}>{p}</Option>
          })}
        </Select>
         <Checkbox defaultChecked={true} onChange={e => this.updateSetting("onemap", e.target.checked)}>Map of All Features</Checkbox>

         <Checkbox onChange={e => this.updateSetting("manymaps", e.target.checked)}>Map Each Feature</Checkbox>
        <Button type="primary" 
          onClick={() => this.props.updateSettings(this.state.mapSettings)}
        >
          Update Maps
        </Button>
      </div>
    );
  }
}

export default Params;
