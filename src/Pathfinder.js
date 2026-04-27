export class Pathfinder {
  static CELL_SIZE = 20;

  // Find shortest path using A*
  static findPath(startX, startY, targetX, targetY, obstacles, bounds, paddingX, paddingY) {
    const cs = this.CELL_SIZE;
    
    // Nearest grid coords
    const startNode = { x: Math.floor(startX / cs) * cs + cs/2, y: Math.floor(startY / cs) * cs + cs/2 };
    let endNode = { x: Math.floor(targetX / cs) * cs + cs/2, y: Math.floor(targetY / cs) * cs + cs/2 };

    // Function to check if a specific world coordinate point is walkable
    const isWalkable = (wx, wy) => {
      // 1. Check bounds
      if (wx < bounds.minX + paddingX || 
          wx > bounds.maxX - paddingX || 
          wy < bounds.minY + paddingY || 
          wy > bounds.maxY - paddingY) {
          return false;
      }
      
      // 2. Check obstacles (with padding so player doesn't clip)
      for(const obs of obstacles) {
         const obsLeft = obs.x - obs.width / 2 - paddingX;
         const obsRight = obs.x + obs.width / 2 + paddingX;
         const obsTop = obs.y - obs.height / 2 - paddingY;
         const obsBottom = obs.y + obs.height / 2 + paddingY;
         
         if (wx > obsLeft && wx < obsRight && wy > obsTop && wy < obsBottom) {
             return false;
         }
      }
      return true;
    };

    // If target is unwalkable, find nearest walkable cell to endNode
    if (!isWalkable(endNode.x, endNode.y)) {
      endNode = this.findNearestWalkable(endNode.x, endNode.y, startNode.x, startNode.y, isWalkable, cs);
      if (!endNode) return []; // Impossible to move anywhere
    }

    // A* Data structures
    const openSet = [];
    const openSetLookup = new Map(); // Fast lookup if node is in openSet
    const closedSet = new Set();
    const cameFrom = new Map();
    
    // Start node details
    const startKey = `${startNode.x},${startNode.y}`;
    const startNodeObj = { x: startNode.x, y: startNode.y, f: 0, g: 0, key: startKey };
    openSet.push(startNodeObj);
    openSetLookup.set(startKey, startNodeObj);
    
    const gScore = new Map();
    gScore.set(startKey, 0);

    const endKey = `${endNode.x},${endNode.y}`;

    // Max iterations to prevent freezing
    let iterations = 0;
    const MAX_ITERATIONS = 2500;

    // 8 directions (including diagonals)
    const dirs = [
      { dx: cs, dy: 0, cost: cs },
      { dx: -cs, dy: 0, cost: cs },
      { dx: 0, dy: cs, cost: cs },
      { dx: 0, dy: -cs, cost: cs },
      { dx: cs, dy: cs, cost: cs * 1.414 },
      { dx: -cs, dy: cs, cost: cs * 1.414 },
      { dx: cs, dy: -cs, cost: cs * 1.414 },
      { dx: -cs, dy: -cs, cost: cs * 1.414 }
    ];

    while (openSet.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      
      // Get node with lowest f score
      let minIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[minIdx].f) {
           minIdx = i;
        }
      }
      const current = openSet.splice(minIdx, 1)[0];
      openSetLookup.delete(current.key);
      
      if (current.key === endKey) {
        return this.reconstructPath(cameFrom, current.key);
      }
      
      closedSet.add(current.key);
      
      for (const dir of dirs) {
        const neighborX = Math.round(current.x + dir.dx);
        const neighborY = Math.round(current.y + dir.dy);
        const neighborKey = `${neighborX},${neighborY}`;
        
        if (closedSet.has(neighborKey)) continue;
        
        if (!isWalkable(neighborX, neighborY)) {
           // Skip unwalkable
           closedSet.add(neighborKey);
           continue; 
        }

        // To prevent corner cutting for diagonals, check if vertical/horizontal neighbors are walkable
        if (dir.dx !== 0 && dir.dy !== 0) {
           if (!isWalkable(Math.round(current.x + dir.dx), current.y) || !isWalkable(current.x, Math.round(current.y + dir.dy))) {
               continue; // clip corner
           }
        }
        
        const tentativeG = gScore.get(current.key) + dir.cost;
        let pNode = openSetLookup.get(neighborKey);
        
        if (!pNode) {
           const h = Math.sqrt(Math.pow(endNode.x - neighborX, 2) + Math.pow(endNode.y - neighborY, 2));
           pNode = { 
             x: neighborX, 
             y: neighborY, 
             key: neighborKey, 
             g: tentativeG, 
             f: tentativeG + h 
           };
           openSet.push(pNode);
           openSetLookup.set(neighborKey, pNode);
           cameFrom.set(neighborKey, { x: current.x, y: current.y, key: current.key });
           gScore.set(neighborKey, tentativeG);
        } else if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
           // This path is the best until now
           cameFrom.set(neighborKey, { x: current.x, y: current.y, key: current.key });
           gScore.set(neighborKey, tentativeG);
           pNode.g = tentativeG;
           const h = Math.sqrt(Math.pow(endNode.x - neighborX, 2) + Math.pow(endNode.y - neighborY, 2));
           pNode.f = tentativeG + h;
        }
      }
    }
    
    return []; // No path found
  }

  static reconstructPath(cameFrom, currentKey) {
    const path = [];
    let curr = cameFrom.get(currentKey);
    
    const [ex, ey] = currentKey.split(',').map(Number);
    path.push({x: ex, y: ey});

    while (curr) {
      path.push({ x: curr.x, y: curr.y });
      curr = cameFrom.get(curr.key);
    }
    path.reverse(); 
    return this.smoothPath(path);
  }

  // Reduces the path to only points where direction changes
  static smoothPath(path) {
    if (path.length <= 2) return path;
    const smooth = [path[0]];
    let lastDir = { 
        dx: Math.sign(path[1].x - path[0].x), 
        dy: Math.sign(path[1].y - path[0].y) 
    };
    
    for (let i = 2; i < path.length; i++) {
        const dir = { 
            dx: Math.sign(path[i].x - path[i-1].x), 
            dy: Math.sign(path[i].y - path[i-1].y) 
        };
        if (dir.dx !== lastDir.dx || dir.dy !== lastDir.dy) {
           smooth.push(path[i-1]);
           lastDir = dir;
        }
    }
    smooth.push(path[path.length - 1]);
    return smooth;
  }

  // BFS to find the closest walkable cell if clicked perfectly inside an obstacle
  static findNearestWalkable(targetX, targetY, startX, startY, isWalkable, cs) {
      const queue = [{x: targetX, y: targetY}];
      const visited = new Set([`${targetX},${targetY}`]);
      
      const dirs = [
          {dx: cs, dy: 0}, {dx: -cs, dy: 0}, {dx: 0, dy: cs}, {dx: 0, dy: -cs},
          {dx: cs, dy: cs}, {dx: -cs, dy: cs}, {dx: cs, dy: -cs}, {dx: -cs, dy: -cs}
      ];

      let closest = {x: startX, y: startY};  // fallback to start just in case
      let minDistance = Infinity;

      for(let i=0; i<1000; i++) { // Limit search depth
          if (queue.length === 0) break;
          let curr = queue.shift();
          
          if (isWalkable(curr.x, curr.y)) {
              // We want the walkable tile that is closest to our original click point
              // But BFS expands radially, so the first walkable tile found might be closest
              // However, just to ensure, we can store it.
              return curr;
          }

          for(let dir of dirs) {
              let nx = curr.x + dir.dx;
              let ny = curr.y + dir.dy;
              let key = `${nx},${ny}`;
              if (!visited.has(key)) {
                  visited.add(key);
                  queue.push({x: nx, y: ny});
              }
          }
      }
      return null;
  }
}
