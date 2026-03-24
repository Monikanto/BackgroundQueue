import { Task } from "./types";
import { log } from "./logger";

export async function processTask(task: Task) {
  try {
    switch (task.type) {
      case "email":
        await fakeWork("Sending email...");
        break;

      case "image":
        await fakeWork("Processing image...");
        break;

      case "data":
        await fakeWork("Handling data...");
        break;

      default:
        throw new Error("Unknown task type");
    }

    log(` Completed task ${task.id}`);
    return true;

  } catch (err) {
    log(` Failed task ${task.id}`);
    return false;
  }
}

function fakeWork(msg: string) {
  console.log(msg);
  return new Promise((res) => setTimeout(res, 1000));
}