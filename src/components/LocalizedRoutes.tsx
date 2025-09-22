import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Index from '@/pages/Index';
import About from '@/pages/About';
import Services from '@/pages/Services';
import Blog from '@/pages/Blog';
import BlogPost from '@/pages/BlogPost';
import Resources from '@/pages/resources';
import Events from '@/pages/Events';
import EventDetail from '@/pages/EventDetail';
import Contact from '@/pages/Contact';
import FAQ from '@/pages/FAQ';
import Edutech from '@/pages/Edutech';
import TeacherDiary from '@/pages/TeacherDiary';
import TeacherDiaryEntry from '@/pages/TeacherDiaryEntry';
import BuilderLessonPlan from '@/pages/BuilderLessonPlan';
import BuilderLessonPlanDetail from '@/pages/BuilderLessonPlanDetail';
import Auth from '@/pages/Auth';
import Account from '@/pages/Account';
import AccountResources from '@/pages/AccountResources';
import AccountResourceNew from '@/pages/AccountResourceNew';
import AccountResourceEdit from '@/pages/AccountResourceEdit';
import NotFound from '@/pages/NotFound';
import Sitemap from '@/pages/Sitemap';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Builder from '@/pages/Builder';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminPage from '@/pages/admin/AdminPage';

const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useParams<{ lang?: string }>();
  const validLangs = ['en', 'sq', 'vi'];
  
  // If lang is provided but invalid, redirect to English version
  if (lang && !validLangs.includes(lang)) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <>
      <Navigation />
      {children}
      <Footer />
    </>
  );
};

const LegacyBuilderRedirect: React.FC<{ includeLanguage?: boolean }> = ({ includeLanguage = false }) => {
  const params = useParams<{ lang?: string; id?: string }>();
  const langPrefix = includeLanguage && params.lang ? `/${params.lang}` : '';
  const destination = params.id
    ? `${langPrefix}/builder/lesson-plans/${params.id}`
    : `${langPrefix}/builder/lesson-plans`;

  return <Navigate to={destination} replace />;
};

export const LocalizedRoutes = () => {
  return (
    <Routes>
      {/* English routes (default) */}
      <Route path="/" element={<RouteWrapper><Index /></RouteWrapper>} />
      <Route path="/about" element={<RouteWrapper><About /></RouteWrapper>} />
      <Route path="/services" element={<RouteWrapper><Services /></RouteWrapper>} />
      <Route path="/blog" element={<RouteWrapper><Blog /></RouteWrapper>} />
      <Route path="/blog/:slug" element={<RouteWrapper><BlogPost /></RouteWrapper>} />
      <Route path="/builder/lesson-plans" element={<RouteWrapper><BuilderLessonPlan /></RouteWrapper>} />
      <Route path="/builder/lesson-plans/:id" element={<RouteWrapper><BuilderLessonPlanDetail /></RouteWrapper>} />
      <Route path="/lesson-plans/builder" element={<LegacyBuilderRedirect />} />
      <Route path="/lesson-plans/builder/:id" element={<LegacyBuilderRedirect />} />
      <Route path="/builder" element={<RouteWrapper><Builder /></RouteWrapper>} />
      <Route path="/resources" element={<RouteWrapper><Resources /></RouteWrapper>} />
      <Route path="/events" element={<RouteWrapper><Events /></RouteWrapper>} />
      <Route path="/events/:slug" element={<RouteWrapper><EventDetail /></RouteWrapper>} />
      <Route path="/contact" element={<RouteWrapper><Contact /></RouteWrapper>} />
      <Route path="/faq" element={<RouteWrapper><FAQ /></RouteWrapper>} />
      <Route path="/edutech" element={<RouteWrapper><Edutech /></RouteWrapper>} />
      <Route path="/teacher-diary" element={<RouteWrapper><TeacherDiary /></RouteWrapper>} />
      <Route path="/teacher-diary/:slug" element={<RouteWrapper><TeacherDiaryEntry /></RouteWrapper>} />
      <Route path="/auth" element={<RouteWrapper><Auth /></RouteWrapper>} />
      <Route path="/account" element={<RouteWrapper><Account /></RouteWrapper>} />
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

      {/* Localized routes for Albanian and Vietnamese */}
      <Route path="/:lang">
        <Route index element={<RouteWrapper><Index /></RouteWrapper>} />
        <Route path="about" element={<RouteWrapper><About /></RouteWrapper>} />
        <Route path="services" element={<RouteWrapper><Services /></RouteWrapper>} />
        <Route path="blog" element={<RouteWrapper><Blog /></RouteWrapper>} />
        <Route path="blog/:slug" element={<RouteWrapper><BlogPost /></RouteWrapper>} />
        <Route path="builder/lesson-plans" element={<RouteWrapper><BuilderLessonPlan /></RouteWrapper>} />
        <Route path="builder/lesson-plans/:id" element={<RouteWrapper><BuilderLessonPlanDetail /></RouteWrapper>} />
        <Route path="lesson-plans/builder" element={<LegacyBuilderRedirect includeLanguage />} />
        <Route path="lesson-plans/builder/:id" element={<LegacyBuilderRedirect includeLanguage />} />
        <Route path="builder" element={<RouteWrapper><Builder /></RouteWrapper>} />
        <Route path="resources" element={<RouteWrapper><Resources /></RouteWrapper>} />
        <Route path="events" element={<RouteWrapper><Events /></RouteWrapper>} />
        <Route path="events/:slug" element={<RouteWrapper><EventDetail /></RouteWrapper>} />
        <Route path="contact" element={<RouteWrapper><Contact /></RouteWrapper>} />
        <Route path="faq" element={<RouteWrapper><FAQ /></RouteWrapper>} />
        <Route path="edutech" element={<RouteWrapper><Edutech /></RouteWrapper>} />
        <Route path="teacher-diary" element={<RouteWrapper><TeacherDiary /></RouteWrapper>} />
        <Route path="teacher-diary/:slug" element={<RouteWrapper><TeacherDiaryEntry /></RouteWrapper>} />
        <Route path="auth" element={<RouteWrapper><Auth /></RouteWrapper>} />
        <Route path="account" element={<RouteWrapper><Account /></RouteWrapper>} />
        <Route path="account/resources" element={<RouteWrapper><AccountResources /></RouteWrapper>} />
        <Route path="account/resources/new" element={<RouteWrapper><AccountResourceNew /></RouteWrapper>} />
        <Route path="account/resources/:id" element={<RouteWrapper><AccountResourceEdit /></RouteWrapper>} />
        <Route path="sitemap" element={<RouteWrapper><Sitemap /></RouteWrapper>} />
      </Route>
      
      <Route path="*" element={<RouteWrapper><NotFound /></RouteWrapper>} />
    </Routes>
  );
};