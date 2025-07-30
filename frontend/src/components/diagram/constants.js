// Shape type constants
export const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  DIAMOND: 'diamond',
  ARROW: 'arrow'
};

// Default shape properties
export const DEFAULT_SHAPE_PROPERTIES = {
  [SHAPE_TYPES.RECTANGLE]: {
    width: 120,
    height: 80,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    opacity: 1
  },
  [SHAPE_TYPES.CIRCLE]: {
    width: 100,
    height: 100,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    opacity: 1
  },
  [SHAPE_TYPES.DIAMOND]: {
    width: 120,
    height: 80,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    opacity: 1
  }
};

// Default arrow properties
export const DEFAULT_ARROW_PROPERTIES = {
  stroke: '#000000',
  strokeWidth: 2,
  opacity: 1,
  markerSize: 8
};

// Grid configuration constants
export const GRID_CONFIG = {
  SIZE: 20,
  COLOR: '#e5e7eb',
  OPACITY: 0.5
};

// Selection styling constants
export const SELECTION_STYLE = {
  stroke: '#3b82f6',
  strokeWidth: 2,
  strokeDasharray: '5,5',
  fill: 'none'
};

// Tool constants for consistency
export const TOOLS = {
  SELECT: 'select',
  RECTANGLE: SHAPE_TYPES.RECTANGLE,
  CIRCLE: SHAPE_TYPES.CIRCLE,
  DIAMOND: SHAPE_TYPES.DIAMOND,
  ARROW: SHAPE_TYPES.ARROW
};