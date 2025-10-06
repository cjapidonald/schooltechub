import React from 'react';
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import Index from '@/pages/Index';
import About from '@/pages/About';
import Services from '@/pages/Services';
import Blog from '@/pages/Blog';
import Events from '@/pages/Events';
import Contact from '@/pages/Contact';
import FAQ from '@/pages/FAQ';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import AccountResources from '@/pages/AccountResources';
import AccountResourceNew from '@/pages/AccountResourceNew';
import AccountResourceEdit from '@/pages/AccountResourceEdit';
import LessonBuilderPage from '@/pages/lesson-builder/LessonBuilderPage';
import NotFound from '@/pages/NotFound';
import Sitemap from '@/pages/Sitemap';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminPage from '@/pages/admin/AdminPage';
import AdminLoginPrototype from '@/pages/admin/AdminLoginPrototype';
import TeacherPage from '@/pages/TeacherPage';
import StudentPage from '@/pages/Student';
import StudentDashboardPage from '@/pages/StudentDashboard';

const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navigation />
    <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
      {children}
    </main>
    <Footer />
  </>
);

const LegacyBuilderRedirect: React.FC = () => {
  const params = useParams<{ id?: string }>();
  const destination = params.id
    ? `/lesson-builder?id=${encodeURIComponent(params.id)}`
    : `/lesson-builder`;

  return <Navigate to={destination} replace />;
};

const LegacyAccountRedirect: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab');
  const tabMap: Record<string, string> = {
    classes: 'classes',
    students: 'students',
    builder: 'lessonBuilder',
    assessments: 'assessments',
  };

  const mappedTab = tab ? tabMap[tab] : undefined;
  const destination = mappedTab ? `/teacher?tab=${mappedTab}` : '/teacher';

  return <Navigate to={destination} replace />;
};

const LegacyClassDashboardRedirect: React.FC = () => {
  const params = useParams<{ id?: string }>();
  const destination = params.id
    ? `/teacher?tab=classes&classId=${encodeURIComponent(params.id)}`
    : `/teacher?tab=classes`;
  return <Navigate to={destination} replace />;
};

const LegacyStudentDashboardRedirect: React.FC = () => {
  const params = useParams<{ id?: string }>();
  const destination = params.id
    ? `/teacher/students/${params.id}`
    : `/teacher?tab=students`;
  return <Navigate to={destination} replace />;
};

export const LocalizedRoutes = () => {
  return (
    <Routes>
      {/* English routes (default) */}
      <Route path="/" element={<RouteWrapper><Index /></RouteWrapper>} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/about" element={<RouteWrapper><About /></RouteWrapper>} />
      <Route path="/services" element={<RouteWrapper><Services /></RouteWrapper>} />
      <Route path="/blog" element={<RouteWrapper><Blog /></RouteWrapper>} />
      <Route path="/blog/new" element={<Navigate to="/" replace />} />
      <Route path="/blog/:slug" element={<Navigate to="/blog" replace />} />
      <Route path="/builder/lesson-plans" element={<Navigate to="/lesson-builder" replace />} />
      <Route path="/builder/lesson-plans/:id" element={<LegacyBuilderRedirect />} />
      <Route path="/lesson-plans/builder" element={<LegacyBuilderRedirect />} />
      <Route path="/lesson-plans/builder/:id" element={<LegacyBuilderRedirect />} />
      <Route path="/lesson-builder" element={<RouteWrapper><LessonBuilderPage /></RouteWrapper>} />
      <Route path="/lesson-builder/:id" element={<LegacyBuilderRedirect />} />
      <Route path="/resources" element={<Navigate to="/" replace />} />
      <Route path="/events" element={<RouteWrapper><Events /></RouteWrapper>} />
      <Route path="/events/:slug" element={<Navigate to="/events" replace />} />
      <Route path="/contact" element={<RouteWrapper><Contact /></RouteWrapper>} />
      <Route path="/faq" element={<RouteWrapper><FAQ /></RouteWrapper>} />
      <Route path="/auth" element={<RouteWrapper><Auth /></RouteWrapper>} />
      <Route path="/account" element={<LegacyAccountRedirect />} />
      <Route path="/teacher" element={<RouteWrapper><TeacherPage /></RouteWrapper>} />
      <Route path="/teacher/classes/:id" element={<LegacyClassDashboardRedirect />} />
      <Route path="/dashboard" element={<Navigate to="/teacher" replace />} />
      <Route path="/student" element={<RouteWrapper><StudentPage /></RouteWrapper>} />
      <Route path="/teacher/students/:id" element={<RouteWrapper><StudentDashboardPage /></RouteWrapper>} />
      <Route path="/dashboard/students/:id" element={<LegacyStudentDashboardRedirect />} />
      <Route path="/my-profile" element={<RouteWrapper><Profile /></RouteWrapper>} />
      <Route path="/profile" element={<Navigate to="/my-profile" replace />} />
      <Route path="/account/classes/:id" element={<LegacyClassDashboardRedirect />} />
      <Route path="/account/resources" element={<RouteWrapper><AccountResources /></RouteWrapper>} />
      <Route path="/account/resources/new" element={<RouteWrapper><AccountResourceNew /></RouteWrapper>} />
      <Route path="/account/resources/:id" element={<RouteWrapper><AccountResourceEdit /></RouteWrapper>} />
      <Route path="/sitemap" element={<RouteWrapper><Sitemap /></RouteWrapper>} />
      <Route path="/admin/login" element={<AdminLoginPrototype />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminPage />} />
        <Route path=":segment" element={<AdminPage />} />
        <Route path=":segment/:subSegment" element={<AdminPage />} />
        <Route path=":segment/:subSegment/:child" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<RouteWrapper><NotFound /></RouteWrapper>} />
    </Routes>
  );
};