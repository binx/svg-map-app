import React, { Component } from 'react';
import center from "@turf/center"
import { Button } from "antd";
import * as d3 from "d3";
import * as d3proj from "d3-geo-projection";
import * as SphericalMercator from "@mapbox/sphericalmercator";
import textures from "textures"; 

class Map extends Component { 
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

    const mapCentroid = center(mapData);

    const svg = d3.select(this.refs.svg)

    const projections = {

    "orthographic" : d3.geoOrthographic().center(mapCentroid.geometry.coordinates).translate([width/4,height/4]) .rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width,height]]).fitExtent([[width * .05, height * .05],[width-(width * .05), height-(height * .05)]],mapData),

    "azimuthalEqualArea":  d3.geoAzimuthalEqualArea().center(mapCentroid.geometry.coordinates).translate([width / 4, height / 4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width, height]]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData),

    "azimuthalEquidistant": d3.geoAzimuthalEquidistant().center(mapCentroid.geometry.coordinates).translate([width / 4, height / 4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width, height]]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData),

    "conicEqualArea": d3.geoConicEqualArea().center(mapCentroid.geometry.coordinates).translate([width / 4, height / 4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width, height]]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData),

    "conicEquidistant": d3.geoConicEquidistant().center(mapCentroid.geometry.coordinates).translate([width / 4, height / 4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width, height]]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData),

    "BakerDinomic": d3proj.geoBaker().center(mapCentroid.geometry.coordinates).translate([width / 4, height / 4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width, height]]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData),

    "BerghausStar": d3proj.geoBerghaus().center(mapCentroid.geometry.coordinates).translate([width / 4, height / 4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width, height]]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData),

    "Mollweide": d3proj.geoMollweide().center(mapCentroid.geometry.coordinates).translate([width / 4, height / 4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width, height]]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData)
    // "equirectangular": d3.geoEquirectangular().translate([0, 0]).center(mapCentroid.geometry.coordinates).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData)

    }
    const projection = projections[proj]

    const path = d3.geoPath(projection) 

    const z = (0 | Math.log(projection.scale()) / Math.LN2) - 5
    // projection.scale(Math.pow(2, 8+z) / (2 * Math.PI))
    // console.log(projection.scale())
    
    // background patttern fill set
    const t = textures.lines()
    .orientation("3/8")
    
    const sphericalProj = ["orthographic","azimuthalEqualArea","azimuthalEquidistant"]


      svg.call(t)
      svg.select(".sphere").style("fill", t.url());

    //generate quadtile array
    const getTiles = () => {
      const tiles = [];
      const z = (0 | Math.log(projection.scale()) / Math.LN2) - 5
      // this is suboptimal
      let upperbound;
      let lowerbound;
      if (z < 5) {
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
    const rawdata = []

    const sortTileData = ti => {
      const tiles = ti.map(tile => {
        const mapTile = zenArray(tile).map(d => ({
          d: path(d), 
          class: getClass(d),
          data: d
        }))
        rawdata.push(mapTile)
        return mapTile.flat(); 
      })
      this.setState({maptiles: tiles.flat()})
      return tiles.flat();

    }

    // rendering our svg in the background every time we re-render
    // todo: deal with computedStyle
    const makeSVG = tiles => {
      const styles = new Set()
      const layers = {
            // add four groups 
      }
      const cssArray = []
      let copySVG = document.createElement('svg')
      copySVG.width=width
      copySVG.height=height
      copySVG.className="tile"
  
      d3.select(copySVG).call(t);
      
      const sphere = `<g id ="sphere"><path class = "sphere" d="${path({type: "Sphere"})}" fill = ${t.url()}></path></g>` 
      
      const defs = (svg.select('defs'))

      d3.select(copySVG)
      copySVG.insertAdjacentHTML('beforeend', sphere);

      tiles.forEach(t => {
        if (t.d === null) return null;
        if (!styles.has(t.class)){
          layers[t.class] = []
          layers[t.class].push(`<path class="${t.class}" d=${t.d}></path>`)
          styles.add(t.class)
        } else{
          layers[t.class].push(`<path class="${t.class}" d=${t.d}></path>`)
        }
      })
      console.log(styles)
      console.log(layers)
      // tiles.forEach(tile => {
      //   // copySVG.insertAdjacentHTML('afterbegin', `<g id=${tile.coords} class="tile"></g>`)
      //  tile.data.map(t => {
      //     if (path(t) === null) return null;
      //     if (!styles.has(getClass(t))){
      //       layers[getClass(t)] = []
      //       layers[getClass(t)].push(`<path class="${getClass(t)}" d=${path(t)}></path>`)
      //       styles.add(getClass(t))
      //     } else {
      //       layers[getClass(t)].push(`<path class="${getClass(t)}" d=${path(t)}></path>`)
      //     }
      //   })
      // })
      Object.keys(layers).forEach(l =>{
        copySVG.insertAdjacentHTML('afterbegin', `<g id=${l} class="tile">${layers[l].join(' ')}</g>`)
      })
      const sitelayer = `<g id ="site"><path class="site" d="${path(mapData)}"></path></g>` 

      copySVG.insertAdjacentHTML('beforeend', sitelayer);
  
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
        this.setState({ sphere: path( ({type: "Sphere"})) })
        console.log(sortTileData(t))
        sortTileData(t)
        // drawTiles(sortTileData(t))
        makeSVG(sortTileData(t))
      })
    }

    tileMaker()
    this.setState({ outline: path(mapData) })

    const reDraw = () => {
      this.setState({ maptiles: rawdata.flat().map(r =>({ class: r.class, d: path(r.data)}))})
    }
    
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
          this.setState({ outline: path(mapData) })
          reDraw()
          
        })
        .on('end', tileMaker)
      )


    const getClass = d => {
      let kind = d.properties.kind || '';
      if (d.properties.boundary)
        kind += 'boundary';
      return `${kind.replace('_','')}`;
    }

    const zenArray = t => {
      let features = [];
      const layers = [ 'earth', 'landuse', 'roads', 'buildings',];
      layers.forEach(function(layer) {
        if (t.data[layer]) {
          for (let i in t.data[layer].features) {
            // Don't include any label placement points
            if (t.data[layer].features[i].properties.label_placement) { continue }

             t.data[layer].features[i].group=layer
             t.data[layer].features[i].class=getClass(t.data[layer].features[i])

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

  //   <defs>
  //   <path id="outline" d="${path(outline)}" />
  //   <clipPath id="clip"><use xlink:href="${new URL("#outline", location)}"/></clipPath>
  // </defs>
  // <g clip-path="url(${new URL("#clip", location)})">
  //   <use xlink:href="${new URL("#outline", location)}" fill="red" />
  //   <path d="${path(graticule)}" stroke="#ccc" fill="none"></path>
  //   <path d="${path(land)}"></path>
  // </g>
  }

  render() {
    const { maptiles=[], outline, copySVG, styleSheet, sphere } = this.state;
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
          <g id = "sphere">
            <path class = "sphere" d = { sphere }  /> 
          </g>
          <g id="tiles" class="tile">
           {maptiles.map((g,i) => (
              <path key={`path${i}`} className={g.class} d={g.d} />))}
          </g>
          <g id="site"> 
          <path className="site" d={outline} ref="outline" id="site"/>
          </g>
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
export default Map;