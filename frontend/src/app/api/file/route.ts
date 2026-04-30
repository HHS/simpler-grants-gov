import { NextResponse } from "next/server";

const maxQueues = 10;
let queueMe = 0;

export const GET = async () => {
  const stream = new ReadableStream({
    start: (controller) => {
      const intervalId = setInterval(() => {
        try {
          if (queueMe === maxQueues) {
            controller.close();
            clearInterval(intervalId);
            queueMe = 0;
            return;
          }
          controller.enqueue(queueMe.toString());
          queueMe++;
        } catch (e) {
          queueMe = 0;
          console.error(e);
          controller.close();
          clearInterval(intervalId);
        }
      }, 1000);
    },
  });
  const response = new Response(stream);
  return response;
};
