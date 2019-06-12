import React, { Component } from 'react';
import './App.css';

import UploadForm from "./components/UploadForm";
import Map from "./components/Map";
import Params from "./components/Params"
class App extends Component {
  state = {
    mapSettings: {
      width: 600,
      height: 600, 
      proj: "mercator"
    }
  };
  updateSettings = (mapSettings) => {
    this.setState({ mapSettings });
  }
  render() {
    const { features = [], mapSettings } = this.state;

    return (
      <div>
        <div className="settings">
          <UploadForm
            features={features}
            setFeatures={features => this.setState({ features })}
          />
          <Params
            features={features}
            mapSettings={mapSettings}
            updateSettings={this.updateSettings}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          { features.map((f,i) => {
            return <Map data={f} key={`map${i}`} mapSettings={mapSettings} />
          })}
        </div>
      </div>
    );
  }
}

export default App;