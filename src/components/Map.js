import React, { Component } from 'react';
import centroid from "@turf/centroid";
// import { tile } from "d3-tile";
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
    //generate quadtile array
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

    this.setState({tiles: tiles.map(tile=>`tile-${tile.x}-${tile.y}-${tile.z}`)})
    return tiles;
  }
  //make request for quadtiles
  const tilePromise = t => {
    const mapTiles = Promise.all(t.map(async d => {
        d.data = await d3.json(`https://tile.nextzen.org/tilezen/vector/v1/256/all/${d.z}/${d.x}/${d.y}.json?api_key=ztkh_UPOQRyakWKMjH_Bzg`);
        return d;
      }))
    return mapTiles
  }
//format data from request
 const sortTileData = ti => {
    const dataArray = []
    ti.forEach(function(tile) {
          let obj = {}
          obj.data = zenArray(tile)
          obj.coords = `tile-${tile.x}-${tile.y}-${tile.z}`
          dataArray.push(obj)
        })
     return dataArray;
   }
  //draw map
  const drawTiles = ti => {
        svg.selectAll('.tile').remove()
        ti.forEach(function(tile) {
          //svg.selectAll('.tile').remove()
          svg.select('#tileWrap').append('g').attr('id', tile.coords).attr('class','tile').selectAll('path')
            .data(tile.data)
            .enter().append("path")
            .attr("d", path)
            .attr("class", function(d) { return getClass(d) })
            .exit();
        })   
        return ti;
  }
  
 
  const tileMaker = () => {
     return tilePromise(getTiles()).then(t => {
      drawTiles(sortTileData(t))
      svg.selectAll('.tile').attr('transform','')
    })
  }

  tileMaker()
  this.setState({ outline: path(mapData) })
  
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
          svg.selectAll('.tile').attr('transform', `translate (${d3.event.x-d3.event.subject.x}, ${d3.event.y-d3.event.subject.y})`)
          console.log(d3.event)
          this.setState({ outline: path(mapData) })
        })
        .on('end', () => {
           tileMaker()
        })
      )
    const zoomies = () => {
      const { x, y, k } = d3.event.transform;
      svg.selectAll('.tile').attr('transform', d3.event.transform)
      projection
        .fitExtent(
          [
            [(width * k * .05) + x, (height * k * .05) + y],
            [width * k - (width * k * .05) + x, height * k - (height * k * .05) + y]
          ],
          newPolygon()
        );

      if (projection.scale() === -0 ){
        projection
        .fitExtent(
          [
            [(width * .05) + x, (height * .05) + y],
            [width - (width * .05) + x, height - (height * .05) + y]
          ],
          mapData
        )
      }
      
      this.setState({ outline: path(mapData) })
    }
    const zoom = d3.zoom()
      .scaleExtent([0.2,2])
      .on("zoom", zoomies)
      .on("end", tileMaker)
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
        if (t.data[layer]) {
          for (let i in t.data[layer].features) {
            // Don't include any label placement points
            if (t.data[layer].features[i].properties.label_placement) { continue }

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
      <g id = "tileWrap">
      </g>
        <path className="site" d={outline} id="site" ref="outline"/>
      </svg>
    );
  }
}


export default Map;