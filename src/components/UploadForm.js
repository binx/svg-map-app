import React, { Component } from 'react';

import { Upload, Button, Icon } from "antd";

class UploadForm extends Component {
  uploadJSON = info => {
    if (info.file.status === "done" && info.fileList[0].response) {
      const features = info.fileList[0].response.features;
      // testing :)
      // this.props.setFeatures([features[0]]);
      this.props.setFeatures(features);
    }
  }
  render() {
    return (
      <div>
        <Upload action={"/upload_json"} onChange={this.uploadJSON}>
          <Button>
            <Icon type="upload" /> Upload GeoJSON
          </Button>
        </Upload>
      </div>
    );
  }
}

export default UploadForm;