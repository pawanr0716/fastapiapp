import { useState } from "react";

function Welcome() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  return (
    <div className="section-card fade-in">
      <h2>Welcome to TalentSpark</h2>
      <p>Your one-stop solution for job and company management</p>
      <div style={{ marginTop: "20px" }}>
        <button className="edit-btn" onClick={increment}>
          Count: {count}
        </button>
      </div>
    </div>
  );
}

export default Welcome;