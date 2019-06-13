import React, { Component } from 'react';

import { Upload, Button, Icon, Input } from "antd";

class UploadForm extends Component {

  render() { 

    let fileReader;

    const handleFileRead = (e) => {
        const content = JSON.parse(fileReader.result);
        const features = content.features;
        this.props.setFeatures(features);
    };

    const handleFileChosen = (file) => {
        fileReader = new FileReader();
        fileReader.onloadend = handleFileRead;
        fileReader.readAsText(file);
    };

    const { features } = this.props;
    const filereader = f => {
      const reader = new FileReader();
      reader.readAsText(f.files[0])

    }
    return (
      <div>
        {!features.length && (
          <p>Let's make a map! Upload a GeoJSON file here:</p>
        )}
        <input type='file'
               id='file'
               accept='.geojson'
               onChange={e => handleFileChosen(e.target.files[0])}
        />
      </div>
    );
  }
}

export default UploadForm;