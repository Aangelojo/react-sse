import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { SSEProgress } from "./components/SSEProgress";

function App() {
  const handleComplete = () => {
    console.log("任务已完成!");
  };

  const handleError = (error: Error) => {
    console.error("任务出错:", error.message);
  };

  return (
    <div className="app">
      <h1>任务进度监控</h1>
      <SSEProgress
        endpoint="http://laravel.sse.test.com/api/"
        eventName="progress"
        onComplete={handleComplete}
        onError={handleError}
      />
    </div>
  );
}

export default App;
