import React, { Component } from 'react';
import textures from 'textures';
import * as d3 from 'd3';

class Palette extends React.Component {
 state = {};
 componentDidMount() {
    // once our file loads, this component is mounted 
    // and we have data to work with
    this.updatePalette();
 }
  componentDidUpdate(prevProps) {
    if (JSON.stringify(this.props.mapSettings) !== JSON.stringify(prevProps.mapSettings))
      this.updatePalette();
  }
 updatePalette = () => {

const swatches = [
    textures.lines().size(8).strokeWidth(2), textures.lines().size(4).strokeWidth(1), textures.lines().orientation('3/8'),textures.lines().orientation('3/8', '7/8'), textures.lines().orientation('vertical','horizontal').size(4).strokeWidth(1), textures.lines().orientation('diagonal').size(7).strokeWidth(2).background('gray').stroke('white'), textures.circles().heavier(), textures.circles().thicker(), textures.circles().radius(5).fill('transparent').strokeWidth(1), textures.paths().d('hexagons').size(8), textures.paths().d('woven'), textures.paths().d('waves')
]

const swatchmap = swatches.map(s => {
    const swatch = d3.select('.palette').append('svg').attr('height', '50px').attr('width', '50px')
    swatch.call(s)
    swatch.append('circle').attr("cx", "25").attr("cy", "25").attr("r", "20").style('stroke','black').style('stroke-weight', 1).style('fill', s.url())
})

this.setState({ swatches: swatchmap })

}
render(){

    const  { swatches =[] } = this.state;
    console.log(swatches)
return (
    <div class = "palette">
        {swatches.map(s => <span>{ s }</span>)}
    </div>

)
}
}
export default Palette; 