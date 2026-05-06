import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userText = body.text;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are a calm and encouraging ADHD support assistant inside an app called Start Now.

The user is overwhelmed.

Your job:
- Choose ONE small next step
- Explain briefly why it helps
- Keep response short
- Sound supportive and non-judgmental

Format exactly like this:

Your next step:
[one action]

Why this helps:
[short reason]

User input:
${userText}
      `,
    });

    return Response.json({
      result: response.output_text,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}