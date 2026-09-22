import { useState } from "react";

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (id: number) => void;
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const [isTogglingThis, setIsTogglingThis] = useState(false);

  const handleToggle = async () => {
    setIsTogglingThis(true);
    await onToggle(todo);
    setIsTogglingThis(false);
  };

  return (
    <li style={{ padding: "0.5rem 0", display: "flex", gap: "1rem" }}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        disabled={isTogglingThis}
      />
      <span
        style={{
          textDecoration: todo.completed ? "line-through" : "none",
          opacity: isTogglingThis ? 0.5 : 1
        }}
      >
        {todo.title}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        style={{
          backgroundColor: "#ff4444",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "0.25rem 0.5rem",
          cursor: "pointer"
        }}
      >
        Delete
      </button>
    </li>
  );
}