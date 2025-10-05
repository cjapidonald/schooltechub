import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Index from '@/pages/Index';
import About from '@/pages/About';
import Services from '@/pages/Services';
import Blog from '@/pages/Blog';
import Events from '@/pages/Events';
import Contact from '@/pages/Contact';
import FAQ from '@/pages/FAQ';
import Auth from '@/pages/Auth';
import LessonBuilderPage from '@/pages/lesson-builder/LessonBuilderPage';
import NotFound from '@/pages/NotFound';
import Sitemap from '@/pages/Sitemap';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminPage from '@/pages/admin/AdminPage';
import AdminLoginPrototype from '@/pages/admin/AdminLoginPrototype';
import DashboardPage from '@/pages/Dashboard';
import StudentPage from '@/pages/Student';

const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navigation />
    <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
      {children}
    </main>
    <Footer />
  </>
);

export const LocalizedRoutes = () => {
  return (
    <Routes>
      {/* English routes (default) */}
      <Route path="/" element={<RouteWrapper><Index /></RouteWrapper>} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/about" element={<RouteWrapper><About /></RouteWrapper>} />
      <Route path="/services" element={<RouteWrapper><Services /></RouteWrapper>} />
      <Route path="/blog" element={<RouteWrapper><Blog /></RouteWrapper>} />
      <Route path="/blog/new" element={<Navigate to="/blog" replace />} />
      <Route path="/blog/:slug" element={<Navigate to="/blog" replace />} />
      <Route path="/builder/lesson-plans" element={<Navigate to="/teacher?tab=curriculum" replace />} />
      <Route path="/builder/lesson-plans/:id" element={<Navigate to="/teacher?tab=curriculum" replace />} />
      <Route path="/curriculum" element={<Navigate to="/teacher?tab=curriculum" replace />} />
      <Route path="/lesson-plans/builder" element={<Navigate to="/teacher?tab=lessonBuilder" replace />} />
      <Route path="/lesson-plans/builder/:id" element={<Navigate to="/teacher?tab=lessonBuilder" replace />} />
      <Route path="/lesson-builder" element={<RouteWrapper><LessonBuilderPage /></RouteWrapper>} />
      <Route path="/lesson-builder/:id" element={<Navigate to="/lesson-builder" replace />} />
      <Route path="/resources" element={<Navigate to="/lesson-builder" replace />} />
      <Route path="/events" element={<RouteWrapper><Events /></RouteWrapper>} />
      <Route path="/events/:slug" element={<Navigate to="/events" replace />} />
      <Route path="/contact" element={<RouteWrapper><Contact /></RouteWrapper>} />
      <Route path="/faq" element={<RouteWrapper><FAQ /></RouteWrapper>} />
      <Route path="/auth" element={<RouteWrapper><Auth /></RouteWrapper>} />
      <Route path="/account" element={<Navigate to="/teacher" replace />} />
      <Route path="/teacher" element={<RouteWrapper><DashboardPage /></RouteWrapper>} />
      <Route path="/teacher/curriculum/:id" element={<Navigate to="/teacher?tab=curriculum" replace />} />
      <Route path="/teacher/classes/:id" element={<Navigate to="/teacher?tab=classes" replace />} />
      <Route path="/dashboard" element={<Navigate to="/teacher" replace />} />
      <Route path="/student" element={<RouteWrapper><StudentPage /></RouteWrapper>} />
      <Route path="/teacher/students/:id" element={<Navigate to="/teacher?tab=students" replace />} />
      <Route path="/dashboard/students/:id" element={<Navigate to="/teacher?tab=students" replace />} />
      <Route path="/my-profile" element={<Navigate to="/teacher" replace />} />
      <Route path="/profile" element={<Navigate to="/teacher" replace />} />
      <Route path="/account/classes/:id" element={<Navigate to="/teacher?tab=classes" replace />} />
      <Route path="/account/resources" element={<Navigate to="/lesson-builder" replace />} />
      <Route path="/account/resources/new" element={<Navigate to="/lesson-builder" replace />} />
      <Route path="/account/resources/:id" element={<Navigate to="/lesson-builder" replace />} />
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