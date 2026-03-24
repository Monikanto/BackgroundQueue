export async function processTask(task: Task): Promise<void>{
    if(!task.playload) throw new Error("plaload is empty");

    switch(task.type){
        case "send_email":
            await Sleep(2000);
            console.log(`sending email to ${task.playload.to} with subject ${task.playload.subject}`);
            break
        case "resize_image":
            console.log(`Realizing image to x: ${task.plaload.new_x} y:${task.plaload.new_y}`);
            break;

        default:
            throw new Error("unsupported task");
    }
}