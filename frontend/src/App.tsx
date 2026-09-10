import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import TaskRegisterPage from "./pages/TaskRegisterPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import ListsAdminPage from "./pages/ListsAdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<TaskRegisterPage />} />
          <Route path="tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="lists" element={<ListsAdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
