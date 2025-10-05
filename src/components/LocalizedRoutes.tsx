import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Index from '@/pages/Index';
import About from '@/pages/About';
import Services from '@/pages/Services';
import Blog from '@/pages/Blog';
import BlogPost from '@/pages/BlogPost';
import BlogBuilderPage from '@/pages/BlogBuilderPage';
import Resources from '@/pages/resources';
import Events from '@/pages/Events';
import EventDetail from '@/pages/EventDetail';
import Contact from '@/pages/Contact';
import FAQ from '@/pages/FAQ';
import BuilderLessonPlan from '@/pages/BuilderLessonPlan';
import BuilderLessonPlanDetail from '@/pages/BuilderLessonPlanDetail';
import Auth from '@/pages/Auth';
import Account from '@/pages/account';
import Profile from '@/pages/Profile';
import ClassDashboard from '@/pages/account/ClassDashboard';
import AccountResources from '@/pages/AccountResources';
import AccountResourceNew from '@/pages/AccountResourceNew';
import AccountResourceEdit from '@/pages/AccountResourceEdit';
import LessonBuilderPage from '@/pages/lesson-builder/LessonBuilderPage';
import LessonBuilderWorkspace from '@/pages/lesson-builder/LessonBuilderWorkspace';
import NotFound from '@/pages/NotFound';
import Sitemap from '@/pages/Sitemap';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminPage from '@/pages/admin/AdminPage';
import DashboardPage from '@/pages/Dashboard';
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
    ? `/builder/lesson-plans/${params.id}`
    : `/builder/lesson-plans`;

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
      <Route path="/blog/new" element={<RouteWrapper><BlogBuilderPage /></RouteWrapper>} />
      <Route path="/blog/:slug" element={<RouteWrapper><BlogPost /></RouteWrapper>} />
      <Route path="/builder/lesson-plans" element={<RouteWrapper><BuilderLessonPlan /></RouteWrapper>} />
      <Route path="/builder/lesson-plans/:id" element={<RouteWrapper><BuilderLessonPlanDetail /></RouteWrapper>} />
      <Route path="/curriculum" element={<Navigate to="/account?tab=curriculum" replace />} />
      <Route path="/lesson-plans/builder" element={<LegacyBuilderRedirect />} />
      <Route path="/lesson-plans/builder/:id" element={<LegacyBuilderRedirect />} />
      <Route path="/lesson-builder" element={<RouteWrapper><LessonBuilderPage /></RouteWrapper>} />
      <Route path="/lesson-builder/:id" element={<RouteWrapper><LessonBuilderWorkspace /></RouteWrapper>} />
      <Route path="/resources" element={<RouteWrapper><Resources /></RouteWrapper>} />
      <Route path="/events" element={<RouteWrapper><Events /></RouteWrapper>} />
      <Route path="/events/:slug" element={<RouteWrapper><EventDetail /></RouteWrapper>} />
      <Route path="/contact" element={<RouteWrapper><Contact /></RouteWrapper>} />
      <Route path="/faq" element={<RouteWrapper><FAQ /></RouteWrapper>} />
      <Route path="/auth" element={<RouteWrapper><Auth /></RouteWrapper>} />
      <Route path="/account" element={<RouteWrapper><Account /></RouteWrapper>} />
      <Route path="/dashboard" element={<RouteWrapper><DashboardPage /></RouteWrapper>} />
      <Route path="/student" element={<RouteWrapper><StudentPage /></RouteWrapper>} />
      <Route path="/dashboard/students/:id" element={<RouteWrapper><StudentDashboardPage /></RouteWrapper>} />
      <Route path="/profile" element={<RouteWrapper><Profile /></RouteWrapper>} />
      <Route path="/account/classes/:id" element={<RouteWrapper><ClassDashboard /></RouteWrapper>} />
      <Route path="/account/resources" element={<RouteWrapper><AccountResources /></RouteWrapper>} />
      <Route path="/account/resources/new" element={<RouteWrapper><AccountResourceNew /></RouteWrapper>} />
      <Route path="/account/resources/:id" element={<RouteWrapper><AccountResourceEdit /></RouteWrapper>} />
      <Route path="/sitemap" element={<RouteWrapper><Sitemap /></RouteWrapper>} />
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