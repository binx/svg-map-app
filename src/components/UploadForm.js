import React, { Component } from 'react';

import { Upload, Button, Icon } from "antd";

class UploadForm extends Component {
  uploadJSON = info => {
    if (info.file.status === "done" && info.fileList[0].response) {
      const features = info.fileList[0].response.features;
      // testing :)
      this.props.setFeatures([features[0], features[1]]);
      //this.props.setFeatures(features);
    }
  }
  render() {
    const { features } = this.props;
    return (
      <div>
        {!features.length && (
          <p>Let's make a map! Upload a GeoJSON file here:</p>
        )}
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