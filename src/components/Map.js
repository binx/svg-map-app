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
      .translate([width/4,height/4]) //I honestly don't know why this works
      .rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]])
      .clipExtent([[0,0],[width,height]])
      .fitExtent(
          [
            [width * .05, height * .05],
            [width - (width * .05), height - (height * .05)]
          ],
          mapData
        )
    const initialScale = projection.scale()

    const path = d3.geoPath(projection)

    const getTiles = () => {
    console.log(projection.scale())
    const tiles = [];
    const z = (0 | Math.log(projection.scale()) / Math.LN2) - 6

    const upperbound = projection.invert([0,0])
    const lowerbound = projection.invert([width,height])
    
    console.log(projection(upperbound), projection(lowerbound))
    console.log(z)
    console.log(upperbound,lowerbound)

    const merc = new SphericalMercator({
      size: 256
    })

    const xyz = merc.xyz([upperbound[0], upperbound[1], lowerbound[0], lowerbound[1]], z)

    const rows = d3.range(xyz.minX, xyz.maxX +1)
    const cols = d3.range(xyz.minY, xyz.maxY+1)

    cols.forEach(function(c) {
      rows.forEach(function(r){
        tiles.push({
          x: r,
          y: c, 
          z: z
        })
      })
    })
    
    let tileID = tiles.map(t => `tile-${t.x}-${t.y}-${t.z}`) 
      this.setState({tiles: tileID})
      console.log(tileID)
    
    const mapTiles = Promise.all(tiles.map(async d => {
      d.data = await d3.json(`https://tile.nextzen.org/tilezen/vector/v1/256/all/${d.z}/${d.x}/${d.y}.json?api_key=ztkh_UPOQRyakWKMjH_Bzg`);
      return d;
    }))
  
  const tilewrap = svg.selectAll('#tileWrap')

  tilewrap.selectAll('g').remove()

  tilewrap.selectAll('g').data(tileID).enter().append('g').attr('id',function(t){return t})

   mapTiles.then(function(ti){
    ti.forEach(function(tile){
      let arr = zenArray(tile)
      svg.select(`#tile-${tile.x}-${tile.y}-${tile.z}`)
      .selectAll('path')
      .data(arr)
      .enter().append("path")
          .attr("d", path)
          .attr("class", function(d) {return getClass(d)})
          .exit();
      })
    })
   this.setState({outline: path(mapData)})
   d3.selectAll('g').attr('transform',"")
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
        this.setState({outline: path(mapData)})
        getTiles()
      })
      .on('end', () => {
        getTiles()
      })
      )
   const zoomies = () => {
    projection
      //.scale(initialScale *d3.event.transform.k)
      .fitExtent(
          [
            [(width*d3.event.transform.k * .05), (height *d3.event.transform.k * .05)],
            [width*d3.event.transform.k - (width*d3.event.transform.k * .05), height*d3.event.transform.k - (height*d3.event.transform.k * .05)]
          ],
          mapData
        )
    
    svg.selectAll('g').attr('transform', d3.event.transform)
    console.log(d3.event.transform)
    console.log(projection.scale())
    
    this.setState({outline: path(mapData)})
  }
    const zoom = d3.zoom()
      //.scaleExtent(projection.scale(), projection.scale*1.5)
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
      if (t.data[layer]) {
        for (let i in t.data[layer].features) {
          // Don't include any label placement points
          if(t.data[layer].features[i].properties.label_placement) { continue }

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
      <g id = "tileWrap" className="tile"></g>
        <path className="site" d={outline} id="site" ref="outline"/>
      </svg>
    );
  }
}


export default Map;