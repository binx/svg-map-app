import React, { Component } from 'react';
import './App.css';

import UploadForm from "./components/UploadForm";
import Map from "./components/Map";

class App extends Component {
  state = {};
  render() {
    const { features = [] } = this.state;
    return (
      <div>
        <UploadForm
          setFeatures={features => this.setState({ features })}
        />
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          { features.map((f,i) => {
            return <Map data={f} key={`map${i}`} />
          })}
        </div>
      </div>
    );
  }
}

export default App;