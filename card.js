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

  let branchInc = 10;

  const drawBranch = (x,y,angle,length,branchLen) => {
    branchInc = branchInc - 1;
    const len = branchLen[branchInc];

    if(length < .1) {
      return;
    }
    const a = Math.PI/4;

    const x1 = x + (length * len) * Math.cos(angle - a);
    const y1 = y + (length * len) * Math.sin(angle - a);
    const p = createPath();
    p.moveTo(x,y);
    p.lineTo(x1, y1);
    p.closePath();
    paths.push(p);
    // drawBranch(x1,y1,angle-a,length/2);

    const x2 = x + (length * len) * Math.cos(angle + a);
    const y2 = y + (length * len) * Math.sin(angle + a);
    const p2 = createPath();
    p2.moveTo(x,y);
    p2.lineTo(x2, y2);
    p2.closePath();
    paths.push(p2);
    // drawBranch(x2,y2,angle+a,length/2);


    const x3 = x + (length) * Math.cos(angle);
    const y3 = y + (length) * Math.sin(angle);
    const p3 = createPath();
    p3.moveTo(x,y);
    p3.lineTo(x3, y3);
    p3.closePath();
    paths.push(p3);
    drawBranch(x3,y3,angle,length/2,branchLen);
    branchInc = 10;
  }

  const drawCircle = (x,y,r) => {

    const segments = Math.floor(Random.range(5,8));
    const angleInc = (Math.PI * 2) / segments;
    const branchAmt = Math.floor(Random.range(3,6));
    const length = (r / 3);

    const branchLen = [];
    for(let i = 0; i < 10; i++) {
      branchLen.push(Random.range(.5,2));
    }

    for(let i = 0; i < segments; i++) {
      const p = createPath();
      const a = angleInc * i;

      p.moveTo(x,y);
      const newX = x + length * Math.cos(a);
      const newY = y + length * Math.sin(a);
      p.lineTo(newX, newY);
      p.closePath();
      paths.push(p);

      drawBranch(newX,newY,a,r/3,branchLen);
    }

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
    const r = Random.range(.3,5);
    
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
