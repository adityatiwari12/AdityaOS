import type { APIRoute } from 'astro';

const DEFAULT_TASKS = [
  { id: '1', title: 'AdityaOS — Window Manager', status: 'completed' },
  { id: '2', title: 'Tokenistt enterprise governance', status: 'in-progress' },
  { id: '3', title: 'TalkwithDB schema-aware prompts', status: 'completed' },
  { id: '4', title: 'Mythos CI/CD reliability', status: 'todo' },
  { id: '5', title: 'Masters application prep', status: 'blocked', description: 'Awaiting GRE dates' },
];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ tasks: DEFAULT_TASKS }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
