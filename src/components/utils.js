import React from 'react';
import center from "@turf/center"
import { Button } from "antd";
import * as d3 from "d3";
import * as d3proj from "d3-geo-projection";
import * as SphericalMercator from "@mapbox/sphericalmercator";
import textures from "textures"; 

export const projections = (proj, mapData, width, height) => {
const mapCentroid = center(mapData);
const projections =  {

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

 return projections[proj]

}

export const getTiles = (projection, width, height) => {
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

  return tiles;
}
export const tilePromise = t => {
  const mapTiles = Promise.all(t.map(async d => {
    d.data = await d3.json(`https://tile.nextzen.org/tilezen/vector/v1/256/all/${d.z}/${d.x}/${d.y}.json?api_key=ztkh_UPOQRyakWKMjH_Bzg`);
    return d;
  }))
  return mapTiles
}

export const getClass = d => {
  let kind = d.properties.kind || '';
  if (d.properties.boundary)
    kind += 'boundary';
  return `${kind.replace('_','')}`;
}
export const sortTileData = (ti, rawdata, path) => {
  const tiles = ti.map(tile => {
    const mapTile = zenArray(tile).map(d => ({
      d: path(d), 
      class: getClass(d),
      data: d
    }))
    rawdata.push(mapTile)
    return mapTile.flat(); 
  })
  // this.setState({maptiles: tiles.flat()})
  return tiles.flat();

}
export const zenArray = t => {
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
