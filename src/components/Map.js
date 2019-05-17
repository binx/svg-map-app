import React, { Component } from 'react';
import centroid from "@turf/centroid";
import { tile } from "d3-tile";
import * as d3 from "d3";

class Map extends Component {
  state = {};
  componentDidMount() {
    // once our file loads, this component is mounted 
    // and we have data to work with
    this.createMapDisplay();
  }
  componentDidUpdate(prevProps) {
    if (JSON.stringify(this.props.mapSettings) !== JSON.stringify(prevProps.mapSettings))
      this.createMapDisplay();
  }
  createMapDisplay = () => {
    const mapData = this.props.data;
    const { width, height } = this.props.mapSettings;

    const mapCentroid = centroid(mapData.geometry);

    const svg = d3.select(this.refs.svg)

    const mercator = d3.geoMercator()
      .translate([width / 2, height / 2])
      .center(mapCentroid.geometry.coordinates)
      .clipExtent([[0,0],[width,height]])
      .fitExtent(
        [
          [width * .05, height * .05],
          [width - (width * .05), height - (height * .05)]
        ],
        mapData
      );

    const projection = d3.geoOrthographic()
      .center(mapCentroid.geometry.coordinates)
      .translate([width/4,height/4]) //I honestly don't know why this works
      .rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]])
      //.clipExtent([[0,0],[width,height]])
      .fitExtent(
          [
            [width * .05, height * .05],
            [width - (width * .05), height - (height * .05)]
          ],
          mapData
        )

    const projscale = projection.scale();
    const path = d3.geoPath().projection(projection);

    

    
    const drawTiles = () => {

      const merctile = tile()
      .size([width, height])
      .scale(mercator.scale() * (2 * Math.PI))
      .translate(mercator([0, 0]))

      console.log(mercator.scale())
      console.log(merctile())

    const mapTiles = merctile().map(async d => {
      d.data = await d3.json(`https://tile.nextzen.org/tilezen/vector/v1/256/all/${d.z}/${d.x}/${d.y}.json?api_key=ztkh_UPOQRyakWKMjH_Bzg`);
      return d;
    })

    Promise.all(mapTiles).then(ti => {
      const mapTiles = ti.map(t => {
          const obj = {};
          obj.coords = `tile-${t.x}-${t.y}-${t.z}`
          obj.mapTile = this.zenArray(t).map(d => ({
            d: path(d),
            class: this.getClass(d),
          }))
          return obj;
        });
        this.setState({
          tiles: mapTiles,
          outline: path(mapData)
        });
    })

    svg.selectAll('path').attr('transform','')

    }

    drawTiles();

    const zoomies = () => {
      mercator.scale(mercator.scale() * d3.event.transform.k)
      .translate([d3.event.transform.x, d3.event.transform.y])

      projection
        .scale(projection.scale() * d3.event.transform.k)
        .translate([d3.event.transform.x, d3.event.transform.y])

      svg.selectAll('path').attr("transform",d3.event.transform)
      this.setState({outline: path(mapData)})
      console.log(d3.event.transform)

      //svg.selectAll('.tile').attr('transform', "")
    }

    const zoom = d3.zoom()
      .on("zoom", zoomies)
      .on("end", drawTiles)
    svg.call(zoom);
   
  }

  getClass = d => {
    let kind = d.properties.kind || '';
    if (d.properties.boundary)
      kind += '_boundary';
    return `${d.layer_name}-layer ${kind}`;
  }

  zenArray = t => {
    let features = [];
    const layers = ['water', 'landuse', 'roads', 'buildings'];
    layers.forEach(function(layer) {
      if (t.data[layer]) {
        for (let i in t.data[layer].features) {
          // Don't include any label placement points
          //if(t.data[layer].features[i].properties.label_placement) { continue }

          // // Don't show large buildings at z13 or below.
          // if(zoom <= 13 && layer == 'buildings') { continue }

          // // Don't show small buildings at z14 or below.
          // if(zoom <= 14 && layer == 'buildings' && data[layer].features[i].properties.area < 2000) { continue }

          features.push(t.data[layer].features[i]);
        }
      }
    });
    return features.sort((a, b) => (
      a.properties.sort_rank ?
      a.properties.sort_rank - b.properties.sort_rank :
      0
    ));
  }

  render() {
    const { tiles = [], outline } = this.state;
    const { width, height } = this.props.mapSettings;
    return (
      <svg
        width={ width } height={ height}
        ref="svg"
        style={{ margin: "20px" }}
      >
       {tiles.map((g,i) => (
          <g key={g.coords} className="tile" id={g.coords}>
         { g.mapTile.map((path,j) => (
              <path key={`path${i}${j}`} className={path.class} d={path.d} id={path.coords}/>
          ))}
          </g>
          ))}
        <path className="site" d={outline} id="site" ref="outline"/>
      </svg>
    );
  }
}


export default Map;