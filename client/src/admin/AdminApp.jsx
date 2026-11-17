import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import AdminLayout from './AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import Availability from './pages/Availability';
import Messages from './pages/Messages';
import Tours from './pages/Tours';
import TourForm from './pages/TourForm';
import Pickups from './pages/Pickups';
import Reviews from './pages/Reviews';
import Guides from './pages/Guides';
import Gallery from './pages/Gallery';
import Articles from './pages/Articles';
import ArticleForm from './pages/ArticleForm';
import Faqs from './pages/Faqs';
import Policies from './pages/Policies';
import Quiz from './pages/Quiz';
import Settings from './pages/Settings';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';

function Protected() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-loading">
        <p>Loading admin…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <AdminLayout />;
}

function RoleRoute({ roles, children }) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) {
    return (
      <div className="admin-panel">
        <h2>Not allowed</h2>
        <p className="admin-muted">Your role does not have access to this page.</p>
      </div>
    );
  }
  return children;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<Protected />}>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
          <Route
            path="availability"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Availability />
              </RoleRoute>
            }
          />
          <Route path="messages" element={<Messages />} />
          <Route
            path="tours"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Tours />
              </RoleRoute>
            }
          />
          <Route
            path="tours/:id"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <TourForm />
              </RoleRoute>
            }
          />
          <Route
            path="pickups"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Pickups />
              </RoleRoute>
            }
          />
          <Route
            path="reviews"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Reviews />
              </RoleRoute>
            }
          />
          <Route
            path="guides"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Guides />
              </RoleRoute>
            }
          />
          <Route
            path="gallery"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Gallery />
              </RoleRoute>
            }
          />
          <Route
            path="articles"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Articles />
              </RoleRoute>
            }
          />
          <Route
            path="articles/:slug"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <ArticleForm />
              </RoleRoute>
            }
          />
          <Route
            path="faqs"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Faqs />
              </RoleRoute>
            }
          />
          <Route
            path="policies"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Policies />
              </RoleRoute>
            }
          />
          <Route
            path="quiz"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Quiz />
              </RoleRoute>
            }
          />
          <Route
            path="settings"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Settings />
              </RoleRoute>
            }
          />
          <Route
            path="reports"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Reports />
              </RoleRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <RoleRoute roles={['owner', 'manager']}>
                <Notifications />
              </RoleRoute>
            }
          />
          <Route
            path="users"
            element={
              <RoleRoute roles={['owner']}>
                <Users />
              </RoleRoute>
            }
          />
          <Route
            path="audit"
            element={
              <RoleRoute roles={['owner']}>
                <AuditLog />
              </RoleRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
  );
}