import centroid from "@turf/centroid";
import * as d3 from "d3";

const proj = [

{"orthographic" = d3.geoOrthographic().center(mapCentroid.geometry.coordinates).translate([width/4,height/4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width,height]]).fitExtent([[width * .05, height * .05],[width-(width * .05), height-(height * .05)]],mapData)}


]
  const mercator = d3.geoMercator().translate([0, 0]).center(mapCentroid.geometry.coordinates).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData)

  const azimuthalEqualArea d3.geoAzimuthalEqualArea().center(mapCentroid.geometry.coordinates).translate([width / 4, height / 4]).rotate([-mapCentroid.geometry.coordinates[0], -mapCentroid.geometry.coordinates[1]]).clipExtent([[0, 0],[width, height]]).fitExtent([[width * .05, height * .05],[width - (width * .05), height - (height * .05)]],mapData)