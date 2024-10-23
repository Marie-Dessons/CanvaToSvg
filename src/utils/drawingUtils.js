export const getMousePos = (canvas, e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const pos = {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
  
  if (e.touches && e.touches[0]) {
    pos.x = (e.touches[0].clientX - rect.left) * scaleX;
    pos.y = (e.touches[0].clientY - rect.top) * scaleY;
  }
  
  return pos;
};

export const drawPath = (ctx, path) => {
  if (path.length < 2) return;
  
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  
  path.forEach((point, i) => {
    if (i === 0) return;
    ctx.lineWidth = point.width;
    ctx.lineTo(point.x, point.y);
  });
  
  if (path[0].fill) {
    ctx.fillStyle = path[0].color || 'black';
    ctx.fill();
  }
  ctx.stroke();
};

export const drawSelectionBox = (ctx, path) => {
  const bounds = getPathBounds(path);
  const padding = 10;
  
  ctx.save();
  ctx.strokeStyle = '#2196F3';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  
  ctx.strokeRect(
    bounds.minX - padding,
    bounds.minY - padding,
    bounds.maxX - bounds.minX + padding * 2,
    bounds.maxY - bounds.minY + padding * 2
  );
  
  // Draw resize handles
  ctx.setLineDash([]);
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
    ctx.fillStyle = 'white';
    ctx.fillRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
  });
  
  ctx.restore();
};

export const drawPreview = (ctx, path) => {
  const bounds = getPathBounds(path);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  
  ctx.save();
  ctx.font = '12px Arial';
  ctx.fillStyle = '#666';
  ctx.fillText(
    `${Math.round(width)}px × ${Math.round(height)}px`,
    bounds.maxX + 10,
    bounds.maxY
  );
  ctx.restore();
};

export const createShape = (start, end, shape, strokeWidth, fill, color, borderRadius = 0) => {
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;
  
  const points = [];
  const commonProps = { width: strokeWidth, fill, color, borderRadius };
  
  switch (shape.id) {
    case 'circle': {
      const radius = Math.min(width, height) / 2;
      for (let i = 0; i <= 360; i += 5) {
        const angle = (i * Math.PI) / 180;
        points.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          ...commonProps
        });
      }
      break;
    }
    case 'square': {
      const size = Math.min(width, height);
      points.push(
        { x: start.x, y: start.y, ...commonProps },
        { x: start.x + size, y: start.y, ...commonProps },
        { x: start.x + size, y: start.y + size, ...commonProps },
        { x: start.x, y: start.y + size, ...commonProps },
        { x: start.x, y: start.y, ...commonProps }
      );
      break;
    }
    case 'line': {
      points.push(
        { x: start.x, y: start.y, ...commonProps },
        { x: end.x, y: end.y, ...commonProps }
      );
      break;
    }
    case 'triangle': {
      points.push(
        { x: centerX, y: start.y, ...commonProps },
        { x: start.x + width, y: start.y + height, ...commonProps },
        { x: start.x, y: start.y + height, ...commonProps },
        { x: centerX, y: start.y, ...commonProps }
      );
      break;
    }
  }
  return points;
};

export const downloadFile = (content, fileName, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const isPointInPath = (canvas, path, point) => {
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  path.forEach((p, i) => {
    if (i > 0) ctx.lineTo(p.x, p.y);
  });
  return ctx.isPointInPath(point.x, point.y);
};

export const getPathBounds = (path) => {
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };
  
  path.forEach(point => {
    bounds.minX = Math.min(bounds.minX, point.x);
    bounds.minY = Math.min(bounds.minY, point.y);
    bounds.maxX = Math.max(bounds.maxX, point.x);
    bounds.maxY = Math.max(bounds.maxY, point.y);
  });
  
  return bounds;
};

export const getScaledPath = (path, scale, center) => {
  return path.map(point => ({
    ...point,
    x: center.x + (point.x - center.x) * scale.x,
    y: center.y + (point.y - center.y) * scale.y
  }));
};

export const getTranslatedPath = (path, dx, dy) => {
  return path.map(point => ({
    ...point,
    x: point.x + dx,
    y: point.y + dy
  }));
};

export const getRotatedPath = (path, angle, center) => {
  return path.map(point => {
    const x = point.x - center.x;
    const y = point.y - center.y;
    return {
      ...point,
      x: center.x + x * Math.cos(angle) - y * Math.sin(angle),
      y: center.y + x * Math.sin(angle) + y * Math.cos(angle)
    };
  });
};

export const getFlippedPath = (path, direction, center) => {
  return path.map(point => ({
    ...point,
    x: direction === 'horizontal' ? center.x * 2 - point.x : point.x,
    y: direction === 'vertical' ? center.y * 2 - point.y : point.y
  }));
};

export const findNearestPoint = (paths, pos, threshold = 10) => {
  let nearest = null;
  let minDistance = threshold;

  paths.forEach(path => {
    path.forEach(point => {
      const distance = Math.sqrt(
        Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    });
  });

  return nearest;
};