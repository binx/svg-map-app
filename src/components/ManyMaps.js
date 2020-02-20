import React, { Component } from 'react';
import circle from "@turf/circle";
import centroid from "@turf/centroid"
import { Button } from "antd";
import * as d3 from "d3";
import * as SphericalMercator from "@mapbox/sphericalmercator";
class ManyMaps extends Component {
  state = {};
  componentDidMount() {
    // once our file loads, this component is mounted 
    // and we have data to work with
    this.createMapDisplay();
  }
  // is there a less sloppy way to do this? 
  componentDidUpdate(prevProps) {
    if (JSON.stringify(this.props.mapSettings) !== JSON.stringify(prevProps.mapSettings))
      this.createMapDisplay();
  }
  createMapDisplay = () => {
    const mapData = this.props.data;
    const { width, height, proj} = this.props.mapSettings;

    const mapCentroid = centroid(mapData.geometry);

    const svg = d3.select(this.refs.svg)

    const projections = {

    "mercator": d3.geoMercator().translate([0, 0]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData),

    "orthographic" : d3.geoOrthographic().center(mapCentroid.geometry.coordinates).translate([width/4,height/4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width,height]]).fitExtent([[width * .05, height * .05],[width-(width * .05), height-(height * .05)]],mapData),

    "azimuthalEqualArea":  d3.geoAzimuthalEqualArea().center(mapCentroid.geometry.coordinates).translate([width / 4, height / 4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width, height]]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData),

    "azimuthalEquidistant": d3.geoAzimuthalEquidistant().center(mapCentroid.geometry.coordinates).translate([width / 4, height / 4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width, height]]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData),

    "conicEqualArea": d3.geoConicEqualArea().center(mapCentroid.geometry.coordinates).translate([width / 4, height / 4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width, height]]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData),

    "conicEquidistant": d3.geoConicEquidistant().center(mapCentroid.geometry.coordinates).translate([width / 4, height / 4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width, height]]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData),

    "equirectangular": d3.geoEquirectangular().translate([0, 0]).center(mapCentroid.geometry.coordinates).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData)


    }
    const projection = projections[proj]
    if (mapData.geometry.type == "Point"){
      const pointCircle = circle(mapData.geometry.coordinates, 5)
      projection.fitExtent(
       [
          [width * .05, height * .05],
          [width - (width * .05), height - (height * .05)]
        ],
        pointCircle
      )

    } else{
      projection.fitExtent(
        [
          [width * .05, height * .05],
          [width - (width * .05), height - (height * .05)]
        ],
        mapData
      )
    }
     

    const path = d3.geoPath(projection) 

    // for zooms
    const newPolygon = () => {
      let n = projection.invert([0, 0])
      let e = projection.invert([width, 0])
      let s = projection.invert([width, height])
      let w = projection.invert([0, height])
      let polygon = {
        "type": "FeatureCollection",
        "features": [{
          "type": "Feature",
          "properties": {},
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
    // there wasn't actually a good reason to break these into smaller functions, I thought that there was but by the time I realized it was unnecessary it was too late

    //generate quadtile array
    const getTiles = () => {
      const tiles = [];
      const z = (0 | Math.log(projection.scale()) / Math.LN2) - 5
      // this is suboptimal
      let upperbound;
      let lowerbound;
      if (z <= 4) {
        upperbound = [-180, 90]
        lowerbound = [180, -180]
      } else {
        upperbound = projection.invert([0, 0])
        lowerbound = projection.invert([width, height])
      }
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

      this.setState({ tiles: tiles.map(tile => `tile-${tile.x}-${tile.y}-${tile.z}`) })
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
        svg.select('#tileWrap').append('g').attr('id', tile.coords).attr('class', 'tile').selectAll('path')
          .data(tile.data)
          .enter().append("path")
          .attr("d", path)
          .attr("class", function(d) { return getClass(d) })
          .exit();
      })
      return ti;
    }
    // rendering our svg in the background every time we re-render
    // todo: deal with computedStyle
    const makeSVG = tiles => {
      const styles = new Set()
      const layers = {}
      const cssArray = []
      let copySVG = document.createElement('svg')
      copySVG.width=width
      copySVG.height=height
      copySVG.className="tile"
      tiles.forEach(tile => {
        // copySVG.insertAdjacentHTML('afterbegin', `<g id=${tile.coords} class="tile"></g>`)
       tile.data.map(t => {
          if (path(t) === null) return null;
          if (!styles.has(getClass(t))){
            layers[getClass(t)] = []
            layers[getClass(t)].push(`<path class="${getClass(t)}" d=${path(t)}></path>`)
            styles.add(getClass(t))
          } else {
            layers[getClass(t)].push(`<path class="${getClass(t)}" d=${path(t)}></path>`)
          }
        })
      })
      Object.keys(layers).forEach(l =>{
        copySVG.insertAdjacentHTML('afterbegin', `<g id=${l} class="tile">${layers[l].join(' ')}</g>`)
      })
      const outline = `<path class="site" d=${this.state.outline}></path>`
      copySVG.insertAdjacentHTML('beforeend', outline);
  
      styles.add('site')
      styles.add('tile')

      Array.from(styles).forEach(s => {
        for (let i in document.styleSheets) {
          if (document.styleSheets[i].cssRules) {
            var rules = document.styleSheets[i].cssRules;
            for (let r in rules) {
              if (rules[r].selectorText) {
                if (rules[r].selectorText.includes(s)) {
                  cssArray.push(rules[r].cssText)
                }
              }

            }
          }
        }
      })

      this.setState({ copySVG: copySVG.innerHTML })
      this.setState({ styleSheet: cssArray.join("\n") })
      return copySVG
    }

    const tileMaker = () => {
      return tilePromise(getTiles()).then(t => {
        drawTiles(sortTileData(t))
        makeSVG(sortTileData(t))
        svg.selectAll('.tile').attr('transform', '')
      })
    }

    tileMaker()
    this.setState({ outline: path(mapData) })

    let rotate0, coords0;
    const coords = () => projection.rotate(rotate0).invert([d3.event.x, d3.event.y]);
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
          this.setState({ outline: path(mapData) })
        })
        .on('end', tileMaker)
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
      console.log(k)

      if (projection.scale() === -0) {
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
    //[0.1, 2]
    const zoom = d3.zoom()
      .scaleExtent([0.1,3])
      .on("zoom", zoomies)
      .on("end", tileMaker)
    svg.call(zoom)

    const getClass = d => {
      let kind = d.properties.kind || '';
      if (d.properties.boundary)
        kind += 'boundary';
      return `${kind.replace('_','')}`;
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
            t.data[layer].features[i].group=layer

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
    const { outline, copySVG, styleSheet } = this.state;
    const { width, height } = this.props.mapSettings;

    const download = () => {
      const svgText = `<svg xmlns="http://www.w3.org/2000/svg"><style type="text/css">${styleSheet}</style>${ copySVG }</svg>`;
      const blob = new Blob([svgText], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', 'map.svg')
      link.click()
    }


    return (
      <div>
        <svg
          width={ width } height={ height}
          ref="svg"
          style={{ margin: "20px", border: "1px solid #ccc" }}
        >
          <g id="tileWrap" />
          <path className="site" d={outline} ref="outline"/>
        </svg>
        <div style={{ margin: "10px" }}>
          <Button type="primary" onClick={download}>
            Download SVG
          </Button>
        </div>
      </div>
    );
  }
}


export default ManyMaps;