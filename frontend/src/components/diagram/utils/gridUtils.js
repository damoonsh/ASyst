/**
 * Grid utility functions for diagram editor
 * Provides functions for grid-based positioning and snapping
 */

/**
 * Snaps a position to the nearest grid intersection
 * @param {Object} position - The position to snap {x, y}
 * @param {number} gridSize - The size of each grid cell
 * @returns {Object} The snapped position {x, y}
 */
export function snapToGrid(position, gridSize) {
  if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
    throw new Error('Position must be an object with numeric x and y properties');
  }
  
  if (!gridSize || gridSize <= 0) {
    throw new Error('Grid size must be a positive number');
  }

  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
}

/**
 * Calculates grid-aligned position from mouse coordinates
 * @param {number} mouseX - The mouse X coordinate
 * @param {number} mouseY - The mouse Y coordinate  
 * @param {number} gridSize - The size of each grid cell
 * @returns {Object} The grid-aligned position {x, y}
 */
export function calculateGridPosition(mouseX, mouseY, gridSize) {
  if (typeof mouseX !== 'number' || typeof mouseY !== 'number') {
    throw new Error('Mouse coordinates must be numbers');
  }
  
  if (!gridSize || gridSize <= 0) {
    throw new Error('Grid size must be a positive number');
  }

  return snapToGrid({ x: mouseX, y: mouseY }, gridSize);
}