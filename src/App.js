import React, { Component } from 'react';
import './App.css';

import UploadForm from "./components/UploadForm";
import ManyMaps from "./components/ManyMaps";
import Map from "./components/Map"
import Params from "./components/Params"
class App extends Component {
  state = {
    mapSettings: {
      width: 600,
      height: 600, 
      proj: "mercator",
      onemap: true,
      manymaps:false
    }
  }
  
  updateSettings = (mapSettings) => {
    this.setState({ mapSettings });
  }

  render() {
    const { features = [], content = {}, mapSettings } = this.state; 
    return (
      <div>
        <div className="settings">
          <UploadForm
            content={content}
            features={features}
            setContent={content => this.setState({content})}
            setFeatures={features => this.setState({ features })}
          />
          <Params
            features={features}
            content={content}
            mapSettings={mapSettings}
            updateSettings={this.updateSettings}
          />
        </div>
       {content.type == "FeatureCollection" &&
       <div>
       {mapSettings.onemap == true && 
        <Map data={content} mapSettings={mapSettings}/>

       }</div>}
       {mapSettings.manymaps == true &&
        <div style={{ display: "flex", flexWrap: "wrap" }}> 
          { features.map((f,i) => {
            return <ManyMaps data={f} key={`map${i}`} mapSettings={mapSettings} />
        })}
        </div>
       }
        
      </div>
    );
  }
}

export default App;