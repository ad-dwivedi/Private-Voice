import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import "./App.css";

import { UIProvider } from "./components/ui/UIProvider";

import LandingPage from "./pages/LandingPage";
import JoinOrganization from "./pages/JoinOrganization";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AnonymousIdentity from "./pages/AnonymousIdentity";
import Suggestions from "./pages/Suggestions";
import Dashboard from "./pages/Dashboard";
import Community from "./pages/Community";
import Complaints from "./pages/Complaints";
import DashboardLayout from "./layouts/DashboardLayout";
import CreatePolls from "./pages/CreatePolls";
import Polls from "./pages/Polls";
import Announcements from "./pages/Announcements";
import Notifications from "./pages/Notifications";
import AuthorityChat from "./pages/AuthorityChat";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminComplaints from "./pages/AdminComplaints";
import AdminSuggestions from "./pages/AdminSuggestions";

function App() {
  return (
    <UIProvider>
      <BrowserRouter>

        <Routes>

          <Route path="/" element={<LandingPage />} />
          <Route path="/organization" element={<JoinOrganization />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/anonymous-identity" element={<AnonymousIdentity />} />

          <Route element={<DashboardLayout />}>

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/community" element={<Community />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/suggestions" element={<Suggestions />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/authority-chat" element={<AuthorityChat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/polls" element={<Polls />} />

            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/create-poll" element={<CreatePolls />} />
            <Route path="/admin-complaints" element={<AdminComplaints />} />
            <Route path="/admin-suggestions" element={<AdminSuggestions />} />

          </Route>

        </Routes>

      </BrowserRouter>
    </UIProvider>
  );
}

export default App;