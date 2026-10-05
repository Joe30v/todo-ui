import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const port = 3000;
const dataFile = join(dirname(fileURLToPath(import.meta.url)), "data", "todos.json");

async function readTodos() {
  try {
    return JSON.parse(await readFile(dataFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return [];
  }
}

async function writeTodos(todos) {
  await mkdir(dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(todos, null, 2)}\n`);
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return body ? JSON.parse(body) : {};
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const todoId = Number(url.pathname.split("/")[2]);

  try {
    const todos = await readTodos();

    if (request.method === "GET" && url.pathname === "/todos") {
      sendJson(response, 200, todos);
      return;
    }

    if (request.method === "POST" && url.pathname === "/todos") {
      const { title } = await readBody(request);
      if (typeof title !== "string" || !title.trim()) {
        sendJson(response, 400, { error: "Title is required" });
        return;
      }

      const todo = {
        id: todos.length ? Math.max(...todos.map(item => item.id)) + 1 : 1,
        title: title.trim(),
        completed: false
      };
      todos.push(todo);
      await writeTodos(todos);
      sendJson(response, 201, todo);
      return;
    }

    if (Number.isInteger(todoId) && todoId > 0 && url.pathname === `/todos/${todoId}`) {
      const todoIndex = todos.findIndex(todo => todo.id === todoId);
      if (todoIndex === -1) {
        sendJson(response, 404, { error: "Todo not found" });
        return;
      }

      if (request.method === "PATCH") {
        const { completed } = await readBody(request);
        if (typeof completed !== "boolean") {
          sendJson(response, 400, { error: "Completed must be a boolean" });
          return;
        }
        todos[todoIndex] = { ...todos[todoIndex], completed };
        await writeTodos(todos);
        sendJson(response, 200, todos[todoIndex]);
        return;
      }

      if (request.method === "DELETE") {
        const [deletedTodo] = todos.splice(todoIndex, 1);
        await writeTodos(todos);
        sendJson(response, 200, deletedTodo);
        return;
      }
    }

    sendJson(response, 404, { error: "Route not found" });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Internal server error" });
  }
});

server.listen(port, () => {
  console.log(`Todo API listening on http://localhost:${port}`);
});
