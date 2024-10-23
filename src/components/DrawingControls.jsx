const STROKE_WIDTHS = [2, 4, 6, 8, 10];
const SHAPES = [
  { id: 'circle', label: 'Cercle', path: 'M 12 22 C 17.5228 22 22 17.5228 22 12 C 22 6.47715 17.5228 2 12 2 C 6.47715 2 2 6.47715 2 12 C 2 17.5228 6.47715 22 12 22 Z' },
  { id: 'square', label: 'Carré', path: 'M3 3h18v18H3z' },
  { id: 'line', label: 'Ligne', path: 'M3 12h18' },
  { id: 'triangle', label: 'Triangle', path: 'M12 2L22 22H2L12 2z' },
];
const BORDER_RADII = [0, 4, 8, 16, 24, 32];

const COLORS = [
  { name: '#000000', class: 'bg-black' },
  { name: '#FFFFFF', class: 'bg-white border border-gray-300' },
  { name: '#EF4444', class: 'bg-red-500' },
  { name: '#EAB308', class: 'bg-yellow-500' },
  { name: '#22C55E', class: 'bg-green-500' },
  { name: '#3B82F6', class: 'bg-blue-500' },
  { name: '#6366F1', class: 'bg-indigo-500' },
  { name: '#A855F7', class: 'bg-purple-500' },
  { name: '#EC4899', class: 'bg-pink-500' },
  { name: '#6B7280', class: 'bg-gray-500' },
];

const DrawingControls = ({ 
  strokeWidth, 
  onStrokeWidthChange,
  onShapeSelect,
  selectedShape,
  isDrawingMode,
  onDrawingModeChange,
  fillEnabled,
  onFillChange,
  showPreview,
  onPreviewChange,
  selectedColor,
  onColorChange,
  borderRadius,
  onBorderRadiusChange
}) => {
  return (
    <div className="flex flex-col gap-6 p-4 bg-white rounded-xl shadow-lg">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Épaisseur du trait</h3>
        <div className="flex gap-2">
          {STROKE_WIDTHS.map(width => (
            <button
              key={width}
              onClick={() => onStrokeWidthChange(width)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all
                ${strokeWidth === width 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-200'}`}
            >
              <div 
                className="bg-gray-800 rounded-full"
                style={{ width: width, height: width }}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Border Radius</h3>
        <div className="flex flex-wrap gap-2">
          {BORDER_RADII.map(radius => (
            <button
              key={radius}
              onClick={() => onBorderRadiusChange(radius)}
              className={`w-10 h-10 flex items-center justify-center border-2 transition-all
                ${borderRadius === radius 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-200'}`}
              style={{ borderRadius: `${radius}px` }}
            >
              <span className="text-xs text-gray-600">{radius}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Couleurs</h3>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(color => (
            <button
              key={color.name}
              onClick={() => onColorChange(color.name)}
              className={`w-8 h-8 rounded-lg transition-all ${color.class}
                ${selectedColor === color.name 
                  ? 'ring-2 ring-blue-500 ring-offset-2' 
                  : 'hover:ring-2 hover:ring-blue-200 hover:ring-offset-1'}`}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Options</h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={fillEnabled}
              onChange={(e) => onFillChange(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Remplir les formes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => onPreviewChange(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Aperçu des dimensions</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Mode de dessin</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onDrawingModeChange(true)}
            className={`px-4 py-2 rounded-lg transition-colors
              ${isDrawingMode 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Main levée
          </button>
          <button
            onClick={() => onDrawingModeChange(false)}
            className={`px-4 py-2 rounded-lg transition-colors
              ${!isDrawingMode 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Formes
          </button>
        </div>
      </div>

      {!isDrawingMode && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Formes</h3>
          <div className="grid grid-cols-2 gap-2">
            {SHAPES.map(shape => (
              <button
                key={shape.id}
                onClick={() => onShapeSelect(shape)}
                className={`p-4 rounded-lg border-2 transition-all
                  ${selectedShape?.id === shape.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-200'}`}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-full h-8"
                  fill={fillEnabled ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d={shape.path} />
                </svg>
                <span className="text-sm mt-1 block">{shape.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingControls;