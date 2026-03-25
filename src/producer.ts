import express from "express";
import {redis} from "./redis";
import {Task} from "./types";
import {v4 as uudiv4} from "uuid";

const app = express();
app.use(express.json());

app.post("/enqueue", async (req, res) => {
    const{ type , payload} = req.body;

    const task: Task ={
        id: uudiv4(),
        type,
        payload,
        createdAt: Date.now()

    };


await redis.lpush("queue",  JSON.stringify(task));

res.json({message : "Task added", taskId: task.id});

});

app.listen(3000, () => {
    console.log("producer running on port 3000");
})
