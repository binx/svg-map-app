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
    console.log(mapCentroid.geometry.coordinates)
    const projection = d3.geoMercator()
      .translate([0,0])
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


    //console.log(outline)
    const outlinepath = d3.select(this.refs.outline)

    const d3tile = tile()
      .size([width, height])
      .scale(projscale * (2 * Math.PI))
      .translate(projection([0, 0]))

    //console.log(d3tile())
    const getZoom = () => {return 1 << (8+(d3tile()[0].z))} //this is basically a hack for reconciling polygon scaling and tile scaling

  const zoomies = () => {
      projection
        .scale(d3.event.transform.k /(2*Math.PI))
        .translate([d3.event.transform.x, d3.event.transform.y]);

      const outline = path(mapData);
      
      const setOutline = () => {
        this.setState({outline: outline})
        }
        setOutline()  
      
  
  d3.selectAll('.tile').attr("transform",`translate(${d3.event.transform.x}, ${d3.event.transform.y}) scale(${d3.event.transform.k/getZoom()})`)
  
  }

    const drawTiles = () => {
      
      const zoomTile = tile()
        .size([width,height])
        .scale(d3.event.transform.k)
        .translate(projection([0,0]));

      //console.log(zoomTile())
      const zoomTiles = zoomTile().map(async d => {
      d.data = await d3.json(`https://tile.nextzen.org/tilezen/vector/v1/256/all/${d.z}/${d.x}/${d.y}.json?api_key=ztkh_UPOQRyakWKMjH_Bzg`);
      return d;
    })

      Promise.all(zoomTiles).then(ti => {
      const zoomedTiles = ti.map(t => {
        const obj = {};
        obj.coords= `tile-${t.x}-${t.y}-${t.z}`
        obj.ortho = this.zenArray(t).map(d => ({
          d: orthoPath(d),
          class: this.getClass(d),
        }))
        obj.mapTile = this.zenArray(t).map(d => ({
          d: path(d),
          class: this.getClass(d),
        }))
        return obj;
      });
      this.setState({
        tiles: zoomedTiles
      });
    })

   d3.selectAll('.tile').attr("transform",``)
   outlinepath.attr("transform","")
  }

   const zoom = d3.zoom()
      //.scaleExtent([1 << 8, 1 << 21]) //this doesn't seem to actually matter
      .on("zoom", zoomies)
      .on("end", drawTiles)

   const center = projection(mapCentroid.geometry.coordinates)
   const svg = d3.select(this.refs.svg);
    
    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity
      //.translate(width/2,height/2)
      .scale(projscale*(Math.PI*2))
      //.translate(-center[0],-center[1])
      ) 

const ortho = d3.geoOrthographic()
//deal with/thing about scaling here later
.center(mapCentroid.geometry.coordinates)
.translate([width/4,height/4]) //I honestly don't know why this works
.rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]])
// .fitExtent(
//     [
//       [width * .05, height * .05],
//       [width - (width * .05), height - (height * .05)]
//     ],
//     mapData
//   );

const orthoPath = d3.geoPath().projection(ortho)

const orthoOutline = orthoPath(mapData)
const orthoSvg = d3.select(this.refs.ortho)

const setOrtho = () => {
        this.setState({orthoOutline: orthoOutline})
        }
        setOrtho()  

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

  render() {
    const { tiles = [], outline, orthoOutline} = this.state;
    return (
      <div>
      <svg
        width="600" height="600" 
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

       <svg
        width="600" height="600" 
        ref="ortho"
        style={{ margin: "20px" }}
      >
      {tiles.map((g,i) => (
          <g key={g.coords} className="tile" id={g.coords}>
         { g.ortho.map((path,j) => (
              <path key={`path${i}${j}`} className={path.class} d={path.d} id={path.coords}/>
          ))}
          </g>
          ))}
          <path className="site" d={orthoOutline} id="site" />
      </svg>
      </div>
  );}
}

export default Map;