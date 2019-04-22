import React, { Component } from 'react';
import centroid from "@turf/centroid";
import { tile } from "d3-tile";
import * as d3 from "d3";

class Map extends Component {
  state = {};
  componentDidMount() {
    // once our file loads, this component is mounted 
    // and we have data to work with
    const mapData = this.props.data;
    const width = 600;
    const height = 600;

    const mapCentroid = centroid(mapData.geometry);

    const projection = d3.geoMercator()
      .translate([width / 2, height / 2])
      .center(mapCentroid.geometry.coordinates)
      .fitExtent(
        [
          [width * .05, height * .05],
          [width - (width * .05), height - (height * .05)]
        ],
        mapData
      );

    const projscale = projection.scale();
    const path = d3.geoPath().projection(projection);

    const outline = path(mapData);
    const outlinepath = d3.select(this.refs.outline)

    const d3tile = tile()
      .size([width, height])
      .scale(projscale * (2 * Math.PI))
      .translate(projection([0, 0]))


    const getZoom = () => {return 1 << (7+(d3tile()[0].z))} //this is basically a hack for reconciling polygon scaling and tile scaling

    const mapTiles = d3tile().map(async d => {
      d.data = await d3.json(`https://tile.nextzen.org/tilezen/vector/v1/256/all/${d.z}/${d.x}/${d.y}.json?api_key=ztkh_UPOQRyakWKMjH_Bzg`);
      return d;
    })
    Promise.all(mapTiles).then(ti => {
      const mapTiles = ti.map(t => {
        const obj = {};
        obj.coords= `tile-${t.x}-${t.y}-${t.z}`
        obj.mapTile = this.zenArray(t).map(d => ({
          d: path(d),
          class: this.getClass(d),
        }))
        return obj;
        //return mapTile;
      });
      this.setState({
        tiles: mapTiles,
        outline
      });
    })

  const zoomies = function(){
      projection
        .scale(d3.event.transform.k / (2*Math.PI))
        .translate([d3.event.transform.x, d3.event.transform.y]);

      outlinepath
      .attr("transform",`translate(${d3.event.transform.x}, ${d3.event.transform.y}) scale(${d3.event.transform.k/getZoom()})`)
      .style("stroke-width", 1 / (d3.event.transform.k))

    d3.selectAll('.tile').attr("transform",`translate(${d3.event.transform.x}, ${d3.event.transform.y})`)
    }

    const drawTiles = () => {
      
      const zoomTile = tile()
        .size([width,height])
        .scale(d3.event.transform.k)
        .translate(projection([0,0]));


      const zoomTiles = zoomTile().map(async d => {
      d.data = await d3.json(`https://tile.nextzen.org/tilezen/vector/v1/256/all/${d.z}/${d.x}/${d.y}.json?api_key=ztkh_UPOQRyakWKMjH_Bzg`);
      return d;
    })

      Promise.all(zoomTiles).then(ti => {
      const zoomedTiles = ti.map(t => {
        const obj = {};
        obj.coords= `tile-${t.x}-${t.y}-${t.z}`
        obj.mapTile = this.zenArray(t).map(d => ({
          d: path(d),
          class: this.getClass(d),
        }))
        return obj;
        //return mapTile;
      });
      this.setState({
        tiles: zoomedTiles
      });
    })
  }

    const zoom = d3.zoom()
      //.scaleExtent([1 << 8, 1 << 21]) //this doesn't seem to actually matter
      .on("zoom", zoomies)
      .on("end", drawTiles)

  
    const svg = d3.select(this.refs.svg);
    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(width/2,height/2)
      .scale(getZoom())) // this sets our zoom scale to be able to take in map tiles, but it also fucks up 
   
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
          // if(d.data[layer].features[i].properties.label_placement) { continue }

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
    const { tiles = [], outline} = this.state;
    return (
      <div>
      <svg
        width="600" height="600" 
        ref="svg"
        style={{ margin: "20px" }}
      >
       {tiles.map((g,i) => (
          <g key={`group${i}`} className="tile" id={g.coords}>
         { g.mapTile.map((path,j) => (
              <path key={`path${i}${j}`} className={path.class} d={path.d} id={path.coords}/>
          ))}
          </g>
          ))}
        <path className="site" d={outline} id="site" ref="outline"/>
      </svg>
      </div>
  );}
}

export default Map;