import { useState, useEffect } from 'react';
import{ TodoItem } from './components/TodoItem';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
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
        if (!response.ok) throw new Error("Failed to fetch todos");
        const loadedTodos: Todo[] = await response.json();
        setTodos(loadedTodos);
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
    if (!input.trim()) return; // prevent adding empty todos

    try {
      const response = await fetch("http://localhost:3000/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input })
      });

      if (!response.ok) throw new Error("Failed to create todo");
      
      const newTodo = await response.json();
      setTodos(currentTodos => [...currentTodos, newTodo]);
      setInput("");
    } catch (err) {
      console.error(err);
      alert("Failed to add todo");
    }
  }

  async function toggleCompleted(todo: Todo) {
    try {
      const response = await fetch(`http://localhost:3000/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed })
      });

      if (!response.ok) throw new Error("Failed to update");
      const updatedTodo = await response.json();
      setTodos(currentTodos => currentTodos.map(currentTodo =>
        currentTodo.id === updatedTodo.id ? updatedTodo : currentTodo
      ));
    } catch (err) {
      console.error(err);
      alert("Failed to update todo");
    }
  }

  async function deleteTodo(id: number) {
    try {
      const response = await fetch(`http://localhost:3000/todos/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete");

      setTodos(currentTodos => currentTodos.filter(todo => todo.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete todo");
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
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleCompleted}
            onDelete={deleteTodo}
          />
        ))}
      </ul>
    </div>
  );
}

export default App;