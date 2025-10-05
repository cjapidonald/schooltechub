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
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
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
      <Route path="/lesson-builder" element={<RouteWrapper><LessonBuilderPage /></RouteWrapper>} />
      <Route path="/events" element={<RouteWrapper><Events /></RouteWrapper>} />
      <Route path="/contact" element={<RouteWrapper><Contact /></RouteWrapper>} />
      <Route path="/faq" element={<RouteWrapper><FAQ /></RouteWrapper>} />
      <Route path="/auth" element={<RouteWrapper><Auth /></RouteWrapper>} />
      <Route path="/teacher" element={<RouteWrapper><DashboardPage /></RouteWrapper>} />
      <Route path="/student" element={<RouteWrapper><StudentPage /></RouteWrapper>} />

      <Route path="*" element={<RouteWrapper><NotFound /></RouteWrapper>} />
    </Routes>
  );
};