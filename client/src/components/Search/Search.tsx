import React, {useState} from "react";
import Axios from "axios";
import {BASE_URL} from "../../config/Config";
const Search = () => {


    const [numbers, setNumbers] = useState("");
  interface AnalysisResult {
    average: number;
    count: number;
  }

  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeData = async () => {
    try {
      const response = await Axios.post(BASE_URL + "/api/analyze", {
        numbers: numbers.split(",").map(Number),
      });
      setResult(response.data);
    } catch (error) {
      console.error("Error analyzing data:", error);
    }
  };

  return (
    <div>
      <h1>Data Analysis</h1>
      <input
        type="text"
        placeholder="Enter numbers separated by commas"
        value={numbers}
        onChange={(e) => setNumbers(e.target.value)}
      />
      <button onClick={analyzeData}>Analyze</button>
      {result && (
        <div>
          <h3>Results:</h3>
          <p>Average: {result.average}</p>
          <p>Count: {result.count}</p>
        </div>
      )}
    </div>
  );
};


export default Search;
