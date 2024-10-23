export const getMousePos = (canvas, e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const pos = {
    x: ((e.clientX || e.touches[0].clientX) - rect.left) * scaleX,
    y: ((e.clientY || e.touches[0].clientY) - rect.top) * scaleY
  };
  
  return pos;
};

export const drawPath = (ctx, path) => {
  if (!path || path.length < 2) return;
  
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  
  path.forEach((point, i) => {
    if (i === 0) return;
    ctx.lineWidth = point.width || 2;
    ctx.lineTo(point.x, point.y);
  });
  
  if (path[0].fill) {
    ctx.fillStyle = '#000';
    ctx.fill();
  }
  
  ctx.stroke();
};

export const drawSelectionBox = (ctx, path) => {
  const bounds = getPathBounds(path);
  const padding = 10;
  
  ctx.save();
  ctx.strokeStyle = '#0066ff';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  
  // Draw selection rectangle
  ctx.strokeRect(
    bounds.minX - padding,
    bounds.minY - padding,
    bounds.maxX - bounds.minX + padding * 2,
    bounds.maxY - bounds.minY + padding * 2
  );
  
  // Draw resize handles
  ctx.setLineDash([]);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#0066ff';
  
  const handleSize = 8;
  const handles = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
    { x: (bounds.minX + bounds.maxX) / 2, y: bounds.minY },
    { x: (bounds.minX + bounds.maxX) / 2, y: bounds.maxY },
    { x: bounds.minX, y: (bounds.minY + bounds.maxY) / 2 },
    { x: bounds.maxX, y: (bounds.minY + bounds.maxY) / 2 }
  ];
  
  handles.forEach(handle => {
    ctx.beginPath();
    ctx.rect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.fill();
    ctx.stroke();
  });
  
  ctx.restore();
};

export const drawPreview = (ctx, path) => {
  if (!path || path.length < 2) return;
  
  const bounds = getPathBounds(path);
  const width = Math.round(bounds.maxX - bounds.minX);
  const height = Math.round(bounds.maxY - bounds.minY);
  
  ctx.save();
  ctx.font = '12px Arial';
  ctx.fillStyle = '#666';
  ctx.fillText(
    `${width}px × ${height}px`,
    bounds.maxX + 10,
    bounds.maxY
  );
  ctx.restore();
};

export const getPathBounds = (path) => {
  if (!path || path.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  
  const bounds = path.reduce((acc, point) => ({
    minX: Math.min(acc.minX, point.x),
    minY: Math.min(acc.minY, point.y),
    maxX: Math.max(acc.maxX, point.x),
    maxY: Math.max(acc.maxY, point.y)
  }), {
    minX: path[0].x,
    minY: path[0].y,
    maxX: path[0].x,
    maxY: path[0].y
  });
  
  return bounds;
};

export const isPointInPath = (canvas, path, point) => {
  const ctx = canvas.getContext('2d');
  const bounds = getPathBounds(path);
  const padding = 5;
  
  // Check if point is within path bounds
  if (
    point.x < bounds.minX - padding ||
    point.x > bounds.maxX + padding ||
    point.y < bounds.minY - padding ||
    point.y > bounds.maxY + padding
  ) {
    return false;
  }
  
  // Check if point is on the path
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  path.forEach((p, i) => {
    if (i === 0) return;
    ctx.lineTo(p.x, p.y);
  });
  
  if (path[0].fill) {
    const result = ctx.isPointInPath(point.x, point.y);
    ctx.restore();
    return result;
  }
  
  ctx.lineWidth = Math.max(...path.map(p => p.width)) + padding * 2;
  const result = ctx.isPointInStroke(point.x, point.y);
  ctx.restore();
  return result;
};

export const getTranslatedPath = (path, dx, dy) => {
  return path.map(point => ({
    ...point,
    x: point.x + dx,
    y: point.y + dy
  }));
};

export const getScaledPath = (path, scale, origin) => {
  return path.map(point => ({
    ...point,
    x: origin.x + (point.x - origin.x) * scale.x,
    y: origin.y + (point.y - origin.y) * scale.y
  }));
};

export const getRotatedPath = (path, angle, origin) => {
  return path.map(point => {
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    return {
      ...point,
      x: origin.x + dx * cos - dy * sin,
      y: origin.y + dx * sin + dy * cos
    };
  });
};

export const getFlippedPath = (path, axis, origin) => {
  return path.map(point => ({
    ...point,
    x: axis === 'vertical' ? point.x : origin.x * 2 - point.x,
    y: axis === 'horizontal' ? point.y : origin.y * 2 - point.y
  }));
};

export const createShape = (start, end, shape, strokeWidth, fillEnabled) => {
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  const points = [];
  switch (shape.id) {
    case 'circle': {
      const radius = Math.min(width, height) / 2;
      for (let i = 0; i <= 360; i += 5) {
        const angle = (i * Math.PI) / 180;
        points.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          width: strokeWidth,
          fill: fillEnabled
        });
      }
      break;
    }
    case 'square': {
      const size = Math.min(width, height);
      points.push(
        { x: minX, y: minY, width: strokeWidth, fill: fillEnabled },
        { x: minX + size, y: minY, width: strokeWidth, fill: fillEnabled },
        { x: minX + size, y: minY + size, width: strokeWidth, fill: fillEnabled },
        { x: minX, y: minY + size, width: strokeWidth, fill: fillEnabled },
        { x: minX, y: minY, width: strokeWidth, fill: fillEnabled }
      );
      break;
    }
    case 'line': {
      points.push(
        { x: start.x, y: start.y, width: strokeWidth },
        { x: end.x, y: end.y, width: strokeWidth }
      );
      break;
    }
    case 'triangle': {
      points.push(
        { x: centerX, y: minY, width: strokeWidth, fill: fillEnabled },
        { x: minX + width, y: minY + height, width: strokeWidth, fill: fillEnabled },
        { x: minX, y: minY + height, width: strokeWidth, fill: fillEnabled },
        { x: centerX, y: minY, width: strokeWidth, fill: fillEnabled }
      );
      break;
    }
  }
  return points;
};

export const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};