import { useState, useEffect } from 'react';
import  TodoItem, {type Todo } from '../components/TodoItem';

interface TodoPageProps {
  token: string;
  onLogout: () => void;
}

export default function TodoPage({ token, onLogout }: TodoPageProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{message: string; type: "add" | "fetch" | "toggle" | "delete"} | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Helper function to add Authorization header
  const fetchWithAuth = (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${token}`  // ADD TOKEN TO EVERY REQUEST
      }
    });
  };

  // Fetch todos on mount
  useEffect(() => {
    async function loadTodos() {
      try {
        setLoading(true);
        const response = await fetchWithAuth("http://localhost:3000/todos");
        
        if (!response.ok) {
          if (response.status === 401) {
            // Token expired or invalid
            onLogout();
            return;
          }
          throw new Error("Failed to fetch todos");
        }
        
        const loadedTodos: Todo[] = await response.json();
        setTodos(loadedTodos);
      } catch (err) { // if fail to fetch then  fetch error message
        setError({message: err instanceof Error ? err.message : "Unknown error", type: "fetch"});
      } finally {
        setLoading(false);
      }
    }

    loadTodos();
  }, [token, onLogout]); //

  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.trim().length === 0) { // ensure input is not empty
      setInputError("Title cannot be empty");
    } else if (value.length > 100) { // ensure that  inout is not more than 100 char
      setInputError("Title is too long (max 100 characters)");
    } else {
      setInputError(null);
    }
  };

  // Add todo with token
  async function addTodo() {
    if (!input.trim() || inputError) return;

    try {
      setIsLoading(true);
      const response = await fetchWithAuth("http://localhost:3000/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input })
      });

      if (!response.ok) throw new Error("Failed to create todo");
      
      const newTodo = await response.json();
      setTodos([...todos, newTodo]);
      setInput("");
      setInputError(null);
      setError(null);
    } catch (err) {
      setError({message: err instanceof Error ? err.message : "Failed to add todo", type: "add"});
    } finally {
      setIsLoading(false);
    }
  }

  // Toggle todo with token
  async function toggleComplete(todo: Todo) {
    try {
      const response = await fetchWithAuth(`http://localhost:3000/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed })
      });

      if (!response.ok) throw new Error("Failed to update");
      const updatedTodo = await response.json(); // update the todo with the updatedTodo
      setTodos(currentTodos => currentTodos.map(t => // map the old with the new 
        t.id === updatedTodo.id ? updatedTodo : t 
      ));
    } catch (err) {
      setError({message: err instanceof Error ? err.message : "Failed to update todo", type: "toggle"});
    }
  }

  // Delete todo with token
  async function deleteTodo(id: number) {
    try {
      const response = await fetchWithAuth(`http://localhost:3000/todos/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete");
      setTodos(currentTodos => currentTodos.filter(todo => todo.id !== id));
    } catch (err) {
      setError({message: err instanceof Error ? err.message : "Failed to delete todo", type: "delete"});
    }
  }

  const filteredTodos = todos.filter(todo => {  // use filter to remove 
    if (filter === "active") return !todo.completed;
    if (filter === "done") return todo.completed;
    return true;
  });

  if (loading) return <div><p>Loading...</p></div>;

  return (
  <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h1>Todo App</h1>
      <button
        onClick={onLogout}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#dc3545",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Logout
      </button>
    </div>

    {/* Error banner */}
    {error && (
      <div
        style={{
          padding: "1rem",
          marginBottom: "1rem",
          backgroundColor: "#ffe6e6",
          color: "#cc0000",
          borderRadius: "4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <span>{error.message}</span>
        <button
          onClick={() => setError(null)}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#cc0000",
            fontSize: "1.5rem",
            cursor: "pointer"
          }}
        >
          ✕
        </button>
      </div>
    )}

    {/* Input section */}
    <div style={{ marginBottom: "1.5rem" }}>
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={(e) => e.key === "Enter" && addTodo()}
        placeholder="Add a new todo..."
        style={{
          padding: "0.5rem",
          fontSize: "1rem",
          borderRadius: "4px",
          border: inputError ? "2px solid #cc0000" : "1px solid #ddd",
          marginRight: "0.5rem",
          width: "300px"
        }}
        disabled={isLoading}
      />
      <button
        onClick={addTodo}
        disabled={isLoading || inputError !== null}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: isLoading || inputError ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading || inputError ? "not-allowed" : "pointer"
        }}
      >
        {isLoading ? "Adding..." : "Add"}
      </button>

      {/* Input error message */}
      {inputError && (
        <p style={{ color: "#cc0000", fontSize: "0.875rem", margin: "0.25rem 0 0 0" }}>
          {inputError}
        </p>
      )}
    </div>

    {/* Filter buttons */}
    <div style={{ marginBottom: "1rem" }}>
      <button
        onClick={() => setFilter("all")}
        style={{
          padding: "0.5rem 1rem",
          marginRight: "0.5rem",
          backgroundColor: filter === "all" ? "#007bff" : "#ddd",
          color: filter === "all" ? "white" : "black",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        All
      </button>

      <button
        onClick={() => setFilter("active")}
        style={{
          padding: "0.5rem 1rem",
          marginRight: "0.5rem",
          backgroundColor: filter === "active" ? "#007bff" : "#ddd",
          color: filter === "active" ? "white" : "black",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Active
      </button>

      <button
        onClick={() => setFilter("done")}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: filter === "done" ? "#007bff" : "#ddd",
          color: filter === "done" ? "white" : "black",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Done
      </button>
    </div>

    {/* Todo list or empty state */}
    {filteredTodos.length === 0 ? (
      <p style={{ color: "#999", fontStyle: "italic" }}>
        {filter === "all"
          ? "No todos yet. Add one to get started!"
          : filter === "active"
            ? "No active todos. Great job! 🎉"
            : "No completed todos yet."}
      </p>
    ) : (
      <ul style={{ listStyle: "none", padding: 0 }}>
        {filteredTodos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleComplete}
            onDelete={deleteTodo}
          />
        ))}
      </ul>
    )}
  </div>

  );
}