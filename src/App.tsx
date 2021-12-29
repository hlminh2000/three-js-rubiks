import React, { useState } from "react";
import { init } from "./game";

function App() {
  const threeContainer = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (threeContainer.current) {
      init({ domContainer: threeContainer.current });
    }
  }, []);

  return (
    <div className="App">
      <div
        style={{
          width: "100%",
          height: "100%",
        }}
        ref={(el) => {
          threeContainer.current = el;
        }}
      />
    </div>
  );
}

export default App;
