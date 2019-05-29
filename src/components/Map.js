import React, { Component } from 'react';
import centroid from "@turf/centroid";
import { tile } from "d3-tile";
import * as d3 from "d3";
import * as SphericalMercator from "@mapbox/sphericalmercator";

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

    const projection = d3.geoOrthographic()
      .center(mapCentroid.geometry.coordinates)
      .translate([width / 4, height / 4]) //I honestly don't know why this works
      .rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]])
      .clipExtent([
        [0, 0],
        [width, height]
      ])
      .fitExtent(
        [
          [width * .05, height * .05],
          [width - (width * .05), height - (height * .05)]
        ],
        mapData
      )
    const initialScale = projection.scale()

    const path = d3.geoPath(projection)

    const newPolygon = () => {
      let n = projection.invert([0,0])
      let e = projection.invert([width,0])
      let s = projection.invert([width,height])
      let w = projection.invert([0,height])
      let polygon = {
      "type": "FeatureCollection",
      "features": [{
           "type": "Feature",
           "properties":{},
            "geometry": {
              "type": "Polygon",
              "coordinates": [
                 [n,
                  e,
                  s,
                  w,
                  n
             ] 
             ]
        }
        }]
      }
      return polygon;
    }

    const getTiles = () => {
      const tiles = [];
      const z = (0 | Math.log(projection.scale()) / Math.LN2) - 5

      const upperbound = projection.invert([0, 0])
      const lowerbound = projection.invert([width, height])

      const merc = new SphericalMercator({
        size: 256
      })

      const xyz = merc.xyz([upperbound[0], upperbound[1], lowerbound[0], lowerbound[1]], z)

      const rows = d3.range(xyz.minX, xyz.maxX + 1)
      const cols = d3.range(xyz.minY, xyz.maxY + 1)

      cols.forEach(function(c) {
        rows.forEach(function(r) {
          tiles.push({
            x: r,
            y: c,
            z: z
          })
        })
      })

      
    //this.setState({tiles: tiles.map(t => { `tile-${t.x}-${t.y}-${t.z}` })})
     const getTiles = Promise.all(tiles.map(async d => {
        d.data = await d3.json(`https://tile.nextzen.org/tilezen/vector/v1/256/all/${d.z}/${d.x}/${d.y}.json?api_key=ztkh_UPOQRyakWKMjH_Bzg`);
        
        return d;
      }))

     getTiles.then(ti =>{
      const tileData = ti.map(t => {
        const obj ={}
        obj.coords = `tile-${t.x}-${t.y}-${t.z}`
        obj.data = zenArray(t.data)
        return obj
      })
      this.setState({tiles: tileData})
      tileData.forEach(function(ti){
        svg.select(`#${ti.coords}`)
          .selectAll('path')
          .remove()
          .data(ti.data)
          .enter().append("path")
          .attr("d", path)
          .attr("class", function(t){ return getClass(t)})
          .exit();
      })
     })
      
      this.setState({ outline: path(mapData) })
      d3.selectAll('g').attr('transform', "")
    }

    getTiles()

    let rotate0, coords0;
    const coords = () => projection.rotate(rotate0).invert([d3.event.x, d3.event.y]);
    // svg.call(zoom);
    
    svg
      .call(d3.drag()
        .on('start', () => {
          rotate0 = projection.rotate();
          coords0 = coords();
        })
        .on('drag', () => {
          const coords1 = coords();
          projection.rotate([
            rotate0[0] + coords1[0] - coords0[0],
            rotate0[1] + coords1[1] - coords0[1],
          ])
          this.setState({ outline: path(mapData) })
          //svg.selectAll('path').attr('d', path())
        })
        .on('end', () => {
          getTiles()

        })
      )
    const zoomies = () => {
      const { x, y, k } = d3.event.transform;
      projection
        //.scale(initialScale *d3.event.transform.k)
        .fitExtent(
          [
            [(width * k * .05) + x, (height * k * .05) + y],
            [width * k - (width * k * .05) + x, height * k - (height * k * .05) + y]
          ],
          newPolygon()
        );

      if (projection.scale() === -0 ){
        projection
        //.scale(initialScale *d3.event.transform.k)
        .fitExtent(
          [
            [(width * .05) + x, (height * .05) + y],
            [width - (width * .05) + x, height - (height * .05) + y]
          ],
          mapData
        )
      }
      svg.selectAll('g').attr('transform', d3.event.transform)
      //projection.fitSize([(width * k)+x,(height*k)+y],newPolygon())
      console.log(projection.scale())
      this.setState({ outline: path(mapData) })
    }
    const zoom = d3.zoom()
      .scaleExtent([0.2,2.5])
      .on("zoom", zoomies)
      .on("end", getTiles)
    svg.call(zoom)

    const getClass = d => {
      let kind = d.properties.kind || '';
      if (d.properties.boundary)
        kind += '_boundary';
      return `${d.layer_name}-layer ${kind}`;
    }

    
    const zenArray = t => {
      let features = [];
      const layers = ['water', 'landuse', 'roads', 'buildings'];
      layers.forEach(function(layer) {
        if (t[layer]) {
          for (let i in t[layer].features) {
            // Don't include any label placement points
            if (t[layer].features[i].properties.label_placement) { continue }

            // // Don't show large buildings at z13 or below.
            // if(zoom <= 13 && layer == 'buildings') { continue }

            // // Don't show small buildings at z14 or below.
            // if(zoom <= 14 && layer == 'buildings' && data[layer].features[i].properties.area < 2000) { continue }

            features.push(t[layer].features[i]);
          }
        }
      });
      return features.sort((a, b) => (
        a.properties.sort_rank ?
        a.properties.sort_rank - b.properties.sort_rank :
        0
      ));
    }
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
      <g id = "tileWrap" className="tile">
       {tiles.map((g,i) => (
          <g key={g.coords} className="tile" id={g.coords}>
          </g>
          ))}
      </g>
        <path className="site" d={outline} id="site" ref="outline"/>
      </svg>
    );
  }
}


export default Map;