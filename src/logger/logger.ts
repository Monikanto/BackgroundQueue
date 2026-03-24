import fs from "fs";

export function log(message: string) {
  const logMsg = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync("logs.txt", logMsg);
}