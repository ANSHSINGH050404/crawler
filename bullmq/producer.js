import { Queue } from 'bullmq';

const notification=new Queue('notification', {
    redis: {
        host: 'localhost',
        port: 6379
    }
})

async function sendNotification() {
  const res=  await notification.add("email to ansh",{
        email:"GKp4K@example.com",
        name:"ansh",
        body:"hello"
    });

    console.log("job added to queue",res.id);
    
}

await sendNotification();