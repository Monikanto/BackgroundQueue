import {redis} from "./redis";
import {processTask} from "./processor"
import { Metrics} from "./types";
import { worker } from "cluster";

const metrics : Metrics = {
    processed: 0,
    failed: 0,
    pending:0
};

const CONCURRENY = 3;

async function WorkerLoop() {
    while(true){
        const taskData = await redis.rpop("queue");

        if(!taskData){
            await sleep(500);
            continue
        }
        const task =  JSON.parse(taskData);

        metrics.pending --;
        
        const success = await processTask(task);

        if (success) metrics.processed++;
        else metrics.failed++;


    }

    
}

function sleep(ms: number){

    return new Promise((res) => setTimeout(res , ms)); 
}

//start multiple workers
for(let i = 0; i<CONCURRENY; i++){
    WorkerLoop();
}

//metrics server
import express from "express";
const app = express();

app.get("/metrics", (_ , res) =>{
    res.json(metrics);
});

app.listen(4000, () =>{
    console.log("Worker metrics on port 4000");
})


