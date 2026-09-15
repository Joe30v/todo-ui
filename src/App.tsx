import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

function TodoItem({ todo }: { todo: Todo }) {
  return (
    <li>
      <input type="checkbox" checked={todo.completed} readOnly />
      <span>{todo.title}</span>
    </li>
  );
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch todos from API on mount
  useEffect(() => {
    async function loadTodos() {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3000/todos");
        if (!response.ok) throw new Error("Failed to fetch todos");  // if fail throw to an error handeling 
        const data = await response.json();
        setTodos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadTodos();
  }, []);

  // Add todo via API
  async function addTodo() {
    if (!input.trim()) return;// prevent adding empty todos

    try {
      const response = await fetch("http://localhost:3000/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input })
      });

      if (!response.ok) throw new Error("Failed to create todo");
      
      const newTodo = await response.json();
      setTodos([...todos, newTodo]);
      setInput("");
    } catch (err) {
      console.error(err);
      alert("Failed to add todo");
    }
  }

  if (loading) return <div><p>Loading...</p></div>;
  if (error) return <div><p>Error: {error}</p></div>;

  return (
    <div>
      <h1>Todo App</h1>
      
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <ul>
        {todos.map(todo => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
    </div>
  );
}

export default App;