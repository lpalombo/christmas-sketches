const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');

// You can force a specific seed by replacing this with a string value
const defaultSeed = '';

// Set a random seed so we can reproduce this print later
Random.setSeed(defaultSeed || Random.getRandomSeed());

// Print to console so we can see which seed is being used and copy it if desired
console.log('Random Seed:', Random.getSeed());

const settings = {
  suffix: Random.getSeed(),
  dimensions: 'postcard',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm'
};

const sketch = (props) => {
  const { width, height, units } = props;

  // Holds all our 'path' objects
  // which could be from createPath, or SVGPath string, or polylines
  const paths = [];
  const circles = [];
  const margin = 1; // in working 'units' based on settings

  const drawCircle = (x,y,r) => {
    const p = createPath();
    p.arc(x,y,r,0,2 * Math.PI);
    paths.push(p);
    const Circle = new Object();
    Circle['x'] = x;
    Circle['y'] = y;
    Circle['r'] = r;
    circles.push(Circle);
  }

  // Draw random arcs
  const count = 20000;
  for (let i = 0; i < count; i++) {
    const x = Random.range(margin,width-margin);
    const y = Random.range(margin,height-margin);
    const r = Random.range(.05,5);
    
    if(circles.length) {
      const filtered = circles.filter((el) => {
        const dx = el.x - x;
        const dy = el.y - y;
        const dist = Math.sqrt( dx*dx + dy*dy );
        if(dist < el.r+r) {
          return el;
        } else {
          return false;
        }
      });
      if(!filtered.length) {
        drawCircle(x,y,r);
      }
    } else {
      drawCircle(x,y,r);
    }
  }

  // Convert the paths into polylines so we can apply line-clipping
  // When converting, pass the 'units' to get a nice default curve resolution
  let lines = pathsToPolylines(paths, { units });

  // Clip to bounds, using a margin in working units
  
  const box = [ margin, margin, width - margin, height - margin ];
  lines = clipPolylinesToBox(lines, box);

  // The 'penplot' util includes a utility to render
  // and export both PNG and SVG files
  return props => renderPaths(lines, {
    ...props,
    lineJoin: 'round',
    lineCap: 'round',
    // in working units; you might have a thicker pen
    lineWidth: 0.04,
    // Optimize SVG paths for pen plotter use
    optimize: true
  });
};

canvasSketch(sketch, settings);
