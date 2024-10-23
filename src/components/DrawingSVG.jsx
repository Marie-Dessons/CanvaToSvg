import React, { useState, useRef, useEffect } from "react";
import Canvas from "./Canvas";
import DrawingControls from "./DrawingControls";
import { 
  getMousePos, 
  drawPath, 
  drawSelectionBox, 
  drawPreview, 
  createShape,
  downloadFile,
  isPointInPath,
  getScaledPath,
  getTranslatedPath,
  getRotatedPath,
  getFlippedPath,
  getPathBounds
} from "../utils/drawingUtils";

const DrawingSVG = ({ width = 800, height = 800, className = "" }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [svgString, setSvgString] = useState("");
  const [selectedPathIndex, setSelectedPathIndex] = useState(null);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawingMode, setIsDrawingMode] = useState(true);
  const [selectedShape, setSelectedShape] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [fillEnabled, setFillEnabled] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialRotation, setInitialRotation] = useState(0);
  const [initialScale, setInitialScale] = useState({ x: 1, y: 1 });
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    redrawCanvas();
  }, [paths, currentPath, selectedPathIndex, showPreview]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw saved paths
    paths.forEach((path, index) => {
      drawPath(ctx, path);
      if (index === selectedPathIndex) {
        drawSelectionBox(ctx, path);
        if (showPreview) drawPreview(ctx, path);
      }
    });

    // Draw current path
    if (currentPath.length > 0) {
      drawPath(ctx, currentPath);
      if (showPreview) drawPreview(ctx, currentPath);
    }
  };

  const getResizeHandle = (path, pos) => {
    const bounds = getPathBounds(path);
    const handleSize = 8;
    const handles = [
      { id: 'tl', x: bounds.minX, y: bounds.minY },
      { id: 'tr', x: bounds.maxX, y: bounds.minY },
      { id: 'br', x: bounds.maxX, y: bounds.maxY },
      { id: 'bl', x: bounds.minX, y: bounds.maxY },
      { id: 'tm', x: (bounds.minX + bounds.maxX) / 2, y: bounds.minY },
      { id: 'bm', x: (bounds.minX + bounds.maxX) / 2, y: bounds.maxY },
      { id: 'ml', x: bounds.minX, y: (bounds.minY + bounds.maxY) / 2 },
      { id: 'mr', x: bounds.maxX, y: (bounds.minY + bounds.maxY) / 2 }
    ];

    return handles.find(handle => 
      Math.abs(handle.x - pos.x) < handleSize &&
      Math.abs(handle.y - pos.y) < handleSize
    );
  };

  const startDrawing = (e) => {
    const pos = getMousePos(canvasRef.current, e);
    setInitialMousePos(pos);

    if (selectedPathIndex !== null) {
      const path = paths[selectedPathIndex];
      const handle = getResizeHandle(path, pos);
      
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
        setInitialScale({ x: 1, y: 1 });
        return;
      }

      if (isPointInPath(canvasRef.current, path, pos)) {
        setIsMoving(true);
        return;
      }
    }

    if (isEditMode || !isDrawingMode) {
      const clickedPathIndex = paths.findIndex(path => 
        isPointInPath(canvasRef.current, path, pos)
      );
      if (clickedPathIndex !== -1) {
        setSelectedPathIndex(clickedPathIndex);
        setIsMoving(true);
        return;
      }
      setSelectedPathIndex(null);
    }

    if (!isDrawingMode && selectedShape) {
      setIsDrawing(true);
      setStartPoint(pos);
      return;
    }

    if (isDrawingMode) {
      setIsDrawing(true);
      setStartPoint(pos);
      setCurrentPath([{ ...pos, width: strokeWidth, fill: fillEnabled }]);
    }
  };

  const draw = (e) => {
    const pos = getMousePos(canvasRef.current, e);

    if (isMoving && selectedPathIndex !== null) {
      const dx = pos.x - initialMousePos.x;
      const dy = pos.y - initialMousePos.y;
      const updatedPaths = [...paths];
      updatedPaths[selectedPathIndex] = getTranslatedPath(paths[selectedPathIndex], dx, dy);
      setPaths(updatedPaths);
      setInitialMousePos(pos);
      return;
    }

    if (isResizing && selectedPathIndex !== null) {
      const path = paths[selectedPathIndex];
      const bounds = getPathBounds(path);
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      
      let scaleX = 1;
      let scaleY = 1;
      
      if (resizeHandle) {
        const dx = pos.x - initialMousePos.x;
        const dy = pos.y - initialMousePos.y;
        
        switch (resizeHandle.id) {
          case 'br':
            scaleX = (bounds.maxX + dx - bounds.minX) / (bounds.maxX - bounds.minX);
            scaleY = (bounds.maxY + dy - bounds.minY) / (bounds.maxY - bounds.minY);
            break;
          case 'bl':
            scaleX = (bounds.maxX - pos.x) / (bounds.maxX - bounds.minX);
            scaleY = (bounds.maxY + dy - bounds.minY) / (bounds.maxY - bounds.minY);
            break;
          case 'tr':
            scaleX = (bounds.maxX + dx - bounds.minX) / (bounds.maxX - bounds.minX);
            scaleY = (bounds.maxY - pos.y) / (bounds.maxY - bounds.minY);
            break;
          case 'tl':
            scaleX = (bounds.maxX - pos.x) / (bounds.maxX - bounds.minX);
            scaleY = (bounds.maxY - pos.y) / (bounds.maxY - bounds.minY);
            break;
          default:
            break;
        }
      }
      
      const updatedPaths = [...paths];
      updatedPaths[selectedPathIndex] = getScaledPath(
        path,
        { x: scaleX, y: scaleY },
        { x: centerX, y: centerY }
      );
      setPaths(updatedPaths);
      setInitialMousePos(pos);
      return;
    }

    if (isRotating && selectedPathIndex !== null) {
      const bounds = getPathBounds(paths[selectedPathIndex]);
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      
      const angle = Math.atan2(pos.y - centerY, pos.x - centerX) -
                   Math.atan2(initialMousePos.y - centerY, initialMousePos.x - centerX);
      
      const updatedPaths = [...paths];
      updatedPaths[selectedPathIndex] = getRotatedPath(
        paths[selectedPathIndex],
        angle - initialRotation,
        { x: centerX, y: centerY }
      );
      setPaths(updatedPaths);
      setInitialRotation(angle);
      return;
    }

    if (!isDrawing) return;

    if (isDrawingMode) {
      setCurrentPath((prev) => [...prev, { ...pos, width: strokeWidth, fill: fillEnabled }]);
    } else if (selectedShape && startPoint) {
      const shapePoints = createShape(startPoint, pos, selectedShape, strokeWidth, fillEnabled);
      setCurrentPath(shapePoints);
    }
  };

  const endDrawing = () => {
    if (isMoving || isResizing || isRotating) {
      setIsMoving(false);
      setIsResizing(false);
      setIsRotating(false);
      setResizeHandle(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      setPaths((prev) => [...prev, currentPath]);
    }
    setCurrentPath([]);
    setStartPoint(null);
  };

  const startRotating = () => {
    if (selectedPathIndex === null) return;
    setIsRotating(true);
    setInitialRotation(0);
  };

  const flipHorizontally = () => {
    if (selectedPathIndex === null) return;
    const path = paths[selectedPathIndex];
    const bounds = getPathBounds(path);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    
    const updatedPaths = [...paths];
    updatedPaths[selectedPathIndex] = getFlippedPath(path, 'horizontal', { x: centerX, y: 0 });
    setPaths(updatedPaths);
  };

  const flipVertically = () => {
    if (selectedPathIndex === null) return;
    const path = paths[selectedPathIndex];
    const bounds = getPathBounds(path);
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    const updatedPaths = [...paths];
    updatedPaths[selectedPathIndex] = getFlippedPath(path, 'vertical', { x: 0, y: centerY });
    setPaths(updatedPaths);
  };

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath([]);
    setSelectedPathIndex(null);
  };

  const deletePath = () => {
    if (selectedPathIndex === null) return;
    const updatedPaths = paths.filter((_, index) => index !== selectedPathIndex);
    setPaths(updatedPaths);
    setSelectedPathIndex(null);
  };

  const generateSVG = () => {
    const svgPaths = paths.map((path) => {
      const d = path.reduce((acc, point, index) => {
        return index === 0
          ? `M ${point.x} ${point.y}`
          : `${acc} L ${point.x} ${point.y}`;
      }, "");
      return `<path 
        d="${d}" 
        fill="${path[0].fill ? 'black' : 'none'}" 
        stroke="black" 
        stroke-width="${path[0].width}"
        stroke-linecap="round"
        stroke-linejoin="round"
      />`;
    });

    const svgContent = `
      <svg 
        width="${width}" 
        height="${height}" 
        xmlns="http://www.w3.org/2000/svg"
        style="stroke-linecap: round; stroke-linejoin: round;"
      >
        ${svgPaths.join("\n        ")}
      </svg>
    `;

    setSvgString(svgContent);
    downloadFile(svgContent, 'drawing.svg', 'image/svg+xml');
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${className}`}>
      <div className="md:col-span-3">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200
                ${isEditMode 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {isEditMode ? 'Quitter mode édition' : 'Mode édition'}
            </button>
            {selectedPathIndex !== null && isEditMode && (
              <>
                <button
                  onClick={startRotating}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Rotation
                </button>
                <button
                  onClick={flipHorizontally}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Flip H
                </button>
                <button
                  onClick={flipVertically}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Flip V
                </button>
              </>
            )}
          </div>
          <div className="relative aspect-square">
            <Canvas
              ref={canvasRef}
              width={width}
              height={height}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={endDrawing}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mt-6">
          <button
            onClick={generateSVG}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Télécharger SVG
          </button>
          
          <button
            onClick={clearCanvas}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Tout effacer
          </button>
          
          <button
            onClick={deletePath}
            disabled={selectedPathIndex === null}
            className={`px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md
              ${selectedPathIndex !== null 
                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer l'élement
          </button>
        </div>
      </div>

      <div className="md:col-span-1">
        <DrawingControls
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          onShapeSelect={setSelectedShape}
          selectedShape={selectedShape}
          isDrawingMode={isDrawingMode}
          onDrawingModeChange={setIsDrawingMode}
          fillEnabled={fillEnabled}
          onFillChange={setFillEnabled}
          showPreview={showPreview}
          onPreviewChange={setShowPreview}
        />
      </div>

      {svgString && (
        <div className="md:col-span-4 bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">SVG Output:</h2>
          <pre className="bg-white p-4 rounded border border-gray-200 overflow-x-auto text-sm">
            {svgString}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DrawingSVG;