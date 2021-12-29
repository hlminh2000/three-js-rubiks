import React, { useState } from "react";
import { init } from "./game";

function App() {
  const threeContainer = React.useRef<HTMLDivElement | null>(null);
  const [vrButton, setVrButton] = useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (threeContainer.current) {
      const { vrButton } = init({ domContainer: threeContainer.current });
      setVrButton(vrButton);
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
      {/* {vrButton} */}
    </div>
  );
}

export default App;
