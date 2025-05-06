import { useState, useEffect } from "react";
import { useSSE } from "../hooks/useSSE";
import "./SSEProgress.css";

interface TaskProgressData {
  progress: number;
  status?: "processing" | "completed" | "failed";
  message?: string;
}

interface SSEProgressProps {
  endpoint: string;
  eventName?: string;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function SSEProgress({
  endpoint,
  eventName = "progress",
  onComplete,
  onError,
}: SSEProgressProps) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("等待启动");

  // 使用 useSSE Hook
  const { data, error, status } = useSSE<TaskProgressData>(eventName, {
    path: taskId ? `${endpoint}task-progress?task_id=${taskId}` : null,
    disabled: !taskId,
  });

  // 启动任务
  const startTask = async () => {
    try {
      const response = await fetch(endpoint + "create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const result = await response.json();
      console.log(result);
      setTaskId(result.data.id);
      setProgress(0);
      setStatusMessage("任务已启动...");
    } catch (err) {
      console.error("启动任务失败:", err);
      setStatusMessage("启动失败");
      if (onError) {
        onError(err instanceof Error ? err : new Error("启动任务失败"));
      }
    }
  };

  // 处理 SSE 数据更新
  // 处理 SSE 数据更新
  useEffect(() => {
    console.log("Received SSE data:", data);
    if (data) {
      // 使用函数式更新确保获取最新状态
      setProgress((prev) => {
        console.log("Updating progress from", prev, "to", data.progress);
        return data.progress;
      });

      if (data.message) {
        setStatusMessage(data.message);
      }

      if (data.status === "completed" && onComplete) {
        console.log("Task completed");
        onComplete();
      }
    }
  }, [data, onComplete]);

  // 处理错误
  useEffect(() => {
    if (error) {
      console.error("SSE 错误:", error);
      setStatusMessage("连接错误");
      if (onError) {
        onError(error);
      }
    }
  }, [error, onError]);

  // 根据状态获取进度条颜色
  const getProgressBarColor = () => {
    if (error || data?.status === "failed") return "#ff4444";
    if (data?.status === "completed") return "#00C851";
    return "#33b5e5";
  };

  // 根据状态获取状态文本
  const getStatusText = () => {
    if (error) return "错误";
    if (!taskId) return "等待启动";
    if (data?.status === "completed") return "已完成";
    if (data?.status === "failed") return "失败";
    return status === "active" ? "进行中" : "连接中...";
  };

  return (
    <div className="sse-progress-container">
      <button
        onClick={startTask}
        disabled={!!taskId && status !== "error"}
        className="sse-start-button"
      >
        {taskId
          ? status === "error"
            ? "重新连接"
            : "任务进行中..."
          : "启动任务"}
      </button>

      <div className="sse-progress-track">
        <div
          className="sse-progress-bar"
          style={{
            width: `${progress}%`,
            backgroundColor: getProgressBarColor(),
          }}
        >
          <span className="sse-progress-text">{progress}%</span>
        </div>
      </div>

      <div className="sse-status">
        <span className="sse-status-text">{getStatusText()}</span>
        {statusMessage && (
          <span className="sse-status-message">{statusMessage}</span>
        )}
      </div>

      {error && (
        <div className="sse-error">
          <span>错误: {error.message}</span>
        </div>
      )}
    </div>
  );
}
