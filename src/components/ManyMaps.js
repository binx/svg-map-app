import React, { Component } from 'react';
import { Button } from "antd";
import * as d3 from "d3";
import textures from "textures"; 
import {sortTileData, tilePromise, getTiles, projections } from "./utils"

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
    const svg = d3.select(this.refs.svg)
    const projection = projections(proj, mapData, width, height)

    const path = d3.geoPath(projection) 

    const z = (0 | Math.log(projection.scale()) / Math.LN2) - 5

    const rawdata = []

    const tileMaker = () => {
      return tilePromise(getTiles(projection, width, height)).then(t => {
        this.setState({ sphere: path( ({type: "Sphere"})) })
        sortTileData(t,rawdata, path)
        console.log(sortTileData(t,rawdata, path))
        // drawTiles(sortTileData(t))
        this.setState({ maptiles: sortTileData(t, rawdata, path)})
        makeSVG(sortTileData(t,rawdata, path))
      })
    }

    tileMaker()
    this.setState({ outline: path(mapData) })

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
  
      d3.select(copySVG).call(texture);
      
      const sphere = `<g id ="sphere"><path class = "sphere" d="${path({type: "Sphere"})}" fill = ${texture.url()}></path></g>` 
      
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

      Object.keys(layers).forEach(l =>{
        copySVG.insertAdjacentHTML('afterbegin', `<g id=${l} class="tile">${layers[l].join(' ')}</g>`)
      })
      const sitelayer = `<g id ="site"><path class="site" d="${path(mapData)} } ></path></g>` 
      
      copySVG.insertAdjacentHTML('beforeend', sitelayer);
  
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


    // background patttern fill set
    const texture = textures.lines()
    .orientation("3/8")

    svg.call(texture)
    svg.select(".sphere").style("fill", texture.url());

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
            <path className = "sphere" d = { sphere }  /> 
          </g>
          <g id="tiles" className="tile">
           {maptiles.map((g,i) => (
              <path key={`path${i}`}  d={g.d} class={g.class} />))}
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