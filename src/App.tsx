import { useState, useEffect } from 'react';
import TodoItem, { type Todo } from './components/TodoItem';
 import  { Navigate, Route, Routes } from 'react-router-dom';
 import TodoPage from './pages/TodoPage';
 import LoginPage from './pages/LoginPage';

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
  const [ token, setToken] = useState<string | null>(localStorage.getItem("token"));

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


   useEffect(() => {
    const savedToken = localStorage.getItem("token");
    setToken(savedToken);
    setLoading(false);
}, []);

    const logout  = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      setToken(null);
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
     <Routes>
      <Route path= "/login"
      element = { token ? < Navigate to ="/todos" /> : <LoginPage onLogin={setToken} />}
    />
      <Route path= "/todos"
      element = { token ? <TodoPage token={token} onLogout={logout} /> : <Navigate to ="/login" />}
    />
    <Route path="/" element={<Navigate to={token ? "/todos" : "/login"} />} />
  </Routes>
  );

}
   
export default App;