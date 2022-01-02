import React from "react";
import { init } from "./game";
import { RubiksCube } from "./game/components/RubiksCube";

function Game() {
  const threeContainer = React.useRef<HTMLDivElement | null>(null);
  const [cube, setCube] = React.useState<RubiksCube>();

  React.useEffect(() => {
    if (threeContainer.current) {
      const { rubiksCube } = init({ domContainer: threeContainer.current });
      setCube(rubiksCube);
    }
  }, []);

  const resetCube = () => {
    cube?.reset();
  };

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
        }}
        ref={(el) => {
          threeContainer.current = el;
        }}
      />
      <button
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          margin: 10,
        }}
        onClick={resetCube}
      >
        Reset
      </button>
    </div>
  );
}

const App = () => {
  return (
    <div className="App">
      <Game />
    </div>
  );
};

export default App;
