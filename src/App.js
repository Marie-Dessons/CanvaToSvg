import DrawingSVG from './components/DrawingSVG';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Drawing Board</h1>
        <DrawingSVG />
      </div>
    </div>
  );
}

export default App;