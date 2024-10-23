import React, { forwardRef } from 'react';

const Canvas = forwardRef(({ 
  width = 800,
  height = 800,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  className = "",
  style = {}
}, ref) => {
  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        width: '100%',
        height: '100%',
        ...style
      }}
      className={`border-2 border-gray-200 rounded-lg cursor-crosshair touch-none ${className}`}
    />
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;