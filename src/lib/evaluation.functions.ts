import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const HISTORY_FILE = path.join(DATA_DIR, "ragas_evaluations.json");
const STATUS_FILE = path.join(DATA_DIR, "ragas_run_status.json");
const LOGS_FILE = path.join(DATA_DIR, "evaluation_logs.txt");
const PID_FILE = path.join(DATA_DIR, "ragas_run_pid.json");

interface EvaluationRun {
  timestamp: string;
  metrics: {
    overall_score: number;
    faithfulness: number;
    answer_relevancy: number;
    context_precision: number;
    context_recall: number;
  };
  results: Array<{
    question: string;
    contexts: string[];
    answer: string;
    ground_truth: string;
    scores: {
      faithfulness: number;
      answer_relevancy: number;
      context_precision: number;
      context_recall: number;
    };
  }>;
}

// Fetch historical Ragas runs
export const getEvaluationHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<EvaluationRun[]> => {
    try {
      if (!fs.existsSync(HISTORY_FILE)) {
        return [];
      }
      const raw = fs.readFileSync(HISTORY_FILE, "utf8");
      return JSON.parse(raw);
    } catch (err) {
      console.error("Error reading evaluation history:", err);
      return [];
    }
  });

// Fetch current run status and logs
export const getEvaluationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    try {
      let status = "idle";
      if (fs.existsSync(STATUS_FILE)) {
        status = fs.readFileSync(STATUS_FILE, "utf8").trim();
      }

      if (status === "running") {
        let pidExists = false;
        if (fs.existsSync(PID_FILE)) {
          const pidStr = fs.readFileSync(PID_FILE, "utf8").trim();
          const pid = parseInt(pidStr, 10);
          if (!isNaN(pid)) {
            try {
              process.kill(pid, 0);
              pidExists = true;
            } catch (err) {
              pidExists = false;
            }
          }
        }
        if (!pidExists) {
          status = "error";
          fs.writeFileSync(STATUS_FILE, "error", "utf8");
          fs.appendFileSync(
            LOGS_FILE,
            "\n[System] Evaluation process was found to be terminated unexpectedly (likely due to laptop restart or server shutdown).\n",
            "utf8"
          );
          if (fs.existsSync(PID_FILE)) {
            try {
              fs.unlinkSync(PID_FILE);
            } catch (e) {}
          }
        }
      }

      let logs = "";
      if (fs.existsSync(LOGS_FILE)) {
        logs = fs.readFileSync(LOGS_FILE, "utf8");
      }

      return { status, logs };
    } catch (err) {
      console.error("Error reading evaluation status:", err);
      return { status: "idle", logs: "Error reading execution status." };
    }
  });

// Trigger a new evaluation run in the background
export const runRagasEvaluation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    try {
      // Create data dir if not exists
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // Check if already running
      let isRunning = false;
      if (fs.existsSync(STATUS_FILE)) {
        let status = fs.readFileSync(STATUS_FILE, "utf8").trim();
        if (status === "running") {
          let pidExists = false;
          if (fs.existsSync(PID_FILE)) {
            const pidStr = fs.readFileSync(PID_FILE, "utf8").trim();
            const pid = parseInt(pidStr, 10);
            if (!isNaN(pid)) {
              try {
                process.kill(pid, 0);
                pidExists = true;
              } catch (err) {
                pidExists = false;
              }
            }
          }
          if (pidExists) {
            isRunning = true;
          } else {
            // Clean up status since process is dead
            fs.writeFileSync(STATUS_FILE, "error", "utf8");
            fs.appendFileSync(
              LOGS_FILE,
              "\n[System] Evaluation process was found to be terminated unexpectedly (likely due to laptop restart or server shutdown).\n",
              "utf8"
            );
            if (fs.existsSync(PID_FILE)) {
              try {
                fs.unlinkSync(PID_FILE);
              } catch (e) {}
            }
          }
        }
      }

      if (isRunning) {
        return { success: false, message: "An evaluation is already running." };
      }

      // Initialize status and log files
      fs.writeFileSync(STATUS_FILE, "running", "utf8");
      fs.writeFileSync(LOGS_FILE, "Starting Ragas Evaluation script...\n", "utf8");

      // Spawn python process
      // Use .venv/Scripts/python on Windows
      const pythonPath = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
      const scriptPath = path.join(process.cwd(), "scripts", "evaluate_ragas.py");

      const processEnv = { ...process.env };
      const child = spawn(pythonPath, [scriptPath], {
        cwd: process.cwd(),
        env: processEnv,
        shell: true,
      });

      if (child.pid) {
        fs.writeFileSync(PID_FILE, child.pid.toString(), "utf8");
      }

      child.stdout.on("data", (data) => {
        fs.appendFileSync(LOGS_FILE, data.toString());
      });

      child.stderr.on("data", (data) => {
        fs.appendFileSync(LOGS_FILE, `[stderr] ${data.toString()}`);
      });

      child.on("close", (code) => {
        console.log(`Ragas evaluation child process exited with code ${code}`);
        if (code === 0) {
          fs.writeFileSync(STATUS_FILE, "finished", "utf8");
          fs.appendFileSync(LOGS_FILE, "\nEvaluation finished successfully!");
        } else {
          fs.writeFileSync(STATUS_FILE, "error", "utf8");
          fs.appendFileSync(LOGS_FILE, `\nEvaluation failed with exit code ${code}. Check logs above.`);
        }
        if (fs.existsSync(PID_FILE)) {
          try {
            fs.unlinkSync(PID_FILE);
          } catch (e) {}
        }
      });

      child.on("error", (err) => {
        console.error("Failed to start child process:", err);
        fs.writeFileSync(STATUS_FILE, "error", "utf8");
        fs.appendFileSync(LOGS_FILE, `\nFailed to start execution process: ${err.message}`);
        if (fs.existsSync(PID_FILE)) {
          try {
            fs.unlinkSync(PID_FILE);
          } catch (e) {}
        }
      });

      return { success: true, message: "Evaluation started successfully." };
    } catch (err: any) {
      console.error("Error starting evaluation:", err);
      return { success: false, message: err.message || "Failed to start evaluation." };
    }
  });
