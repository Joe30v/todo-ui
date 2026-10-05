
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/api/users`);
  if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
  return response.json();
};
