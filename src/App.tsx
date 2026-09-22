import { useState, useEffect } from 'react';
import TodoItem, { type Todo } from './components/TodoItem';


function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [ inputError,setInputError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{message: string; type: "add" | "fetch" | "toggle" | "delete"} | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [isLoading, setIsLoading] = useState(false);
  const activeCount = todos.filter(todo => !todo.completed).length;
  const doneCount = todos.filter(todo => todo.completed).length;
  



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    if (value.trim() === "") {
      setInputError("Todo title cannot be empty");
    }else  if ( value.length >100){
      setInputError("Todo title cannot exceed 100 characters");
    }else {
      setInputError(null);
    }
  };

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
        setError({message: err instanceof Error ? err.message : "Unknown error", type: "fetch"});
      } finally {
        setLoading(false);
      }
    }

    loadTodos();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("todoFilter");
    if (saved === "all" || saved === "active" || saved === "done") {
      setFilter(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("todoFilter", filter);
  }, [filter]);

  // Add todo via API
  async function addTodo() {
    if (!input.trim()){
      setError({message: "Todo title cannot be empty", type: "add"});
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input })
      });

      if (!response.ok){
        const errorData = await response.json();
        setError({ message: errorData.message || "Failed to add todo", type: "add" });
        return;
      }
      
      const newTodo = await response.json();
      setTodos([...todos,newTodo]);
      setInput("");
      setError(null); // Clear any previous error
    } catch (err) {
      setError({message:"Network error. Check your connection.", type:"add"});
    } finally {
      setIsLoading(false);
    }
  };

  async function toggleComplete(todo: Todo) {
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
      setError({message: err instanceof Error ? err.message : "Failed to update todo", type: "toggle"});
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
      setError({message: err instanceof Error ? err.message : "Failed to delete todo", type: "delete"});
    }
  }

  async function clearCompleted() {
    const completedIds = todos.filter(todo => todo.completed).map(todo => todo.id);

    if (completedIds.length === 0) return;

    try {
      const responses = await Promise.all(
        completedIds.map(id => fetch(`http://localhost:3000/todos/${id}`, {
          method: "DELETE"
        }))
      );

      if (responses.some(response => !response.ok)) {
        throw new Error("Failed to clear completed todos");
      }

      setTodos(currentTodos => currentTodos.filter(todo => !todo.completed));
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Failed to clear completed todos",
        type: "delete"
      });
    }
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === "active") return !todo.completed;
    if (filter === "done") return todo.completed;
    return true;
  });

  if (loading) return <div><p>Loading...</p></div>;

  return (
    <div>
      <h1>Todo App</h1>

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
      
      <div>
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
    border: inputError ? "2px solid #cc0000" : "1px solid #ddd"
  }}
/>

{inputError && (
  <p style={{ color: "#cc0000", fontSize: "0.875rem", margin: "0.25rem 0 0 0" }}>
    {inputError}
  </p>
)}
        
        <button
          onClick={addTodo}
          disabled={isLoading || inputError !== null}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: isLoading || inputError ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            marginLeft: "10px",
            cursor: isLoading || inputError ? "not-allowed" : "pointer"
          }}
        >
          {isLoading ? "Adding..." : "Add"}
        </button>
        
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => setFilter("all")}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem", //BETTER SPACING 
            marginRight: "0.5rem", // SPACE BETWEEN BUTTONS
            backgroundColor: filter === "all" ? "#007bff" : "#ddd",
            color: filter === "all" ? "white" : "black",
            border: "none",
            borderRadius: "4px", // rounded corner
            cursor: "pointer" //cursor pointer on hover 
          }}
        >
          All ({todos.length})
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
          Active ({activeCount})
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
          Done ({doneCount})
        </button>

        <button
          onClick={clearCompleted}
          disabled={doneCount === 0}
          style={{
            marginLeft: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: doneCount === 0 ? "#ccc" : "#ff4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: doneCount === 0 ? "not-allowed" : "pointer"
          }}
        >
          Clear completed
        </button>
      </div>

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

export default App;