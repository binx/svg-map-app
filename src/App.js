import React, { Component } from 'react';
import './App.css';

import { Upload, Button, Icon } from "antd";

class App extends Component {
  uploadJSON = info => {
    if (info.file.status === "done" && info.fileList[0].response) {
      console.log(info.fileList[0].response);
    }
  }
  render() {
    return (
      <div>
        <Upload style={{ marginLeft: "20px" }}
          action={"/upload_json"}
          onChange={this.uploadJSON}
        >
          <Button>
            <Icon type="upload" /> Upload GeoJSON
          </Button>
        </Upload>
      </div>
    );
  }
}

export default App;