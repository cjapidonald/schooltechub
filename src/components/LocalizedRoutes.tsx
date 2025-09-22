import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Index from '@/pages/Index';
import About from '@/pages/About';
import Services from '@/pages/Services';
import Blog from '@/pages/Blog';
import BlogPost from '@/pages/BlogPost';
import Events from '@/pages/Events';
import EventDetail from '@/pages/EventDetail';
import Contact from '@/pages/Contact';
import FAQ from '@/pages/FAQ';
import Edutech from '@/pages/Edutech';
import TeacherDiary from '@/pages/TeacherDiary';
import TeacherDiaryEntry from '@/pages/TeacherDiaryEntry';
import LessonPlans from '@/pages/LessonPlans';
import LessonPlan from '@/pages/LessonPlan';
import Worksheets from '@/pages/Worksheets';
import Worksheet from '@/pages/Worksheet';
import Auth from '@/pages/Auth';
import Account from '@/pages/Account';
import NotFound from '@/pages/NotFound';
import Sitemap from '@/pages/Sitemap';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Builder from '@/pages/Builder';

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

export const LocalizedRoutes = () => {
  return (
    <Routes>
      {/* English routes (default) */}
      <Route path="/" element={<RouteWrapper><Index /></RouteWrapper>} />
      <Route path="/about" element={<RouteWrapper><About /></RouteWrapper>} />
      <Route path="/services" element={<RouteWrapper><Services /></RouteWrapper>} />
      <Route path="/blog" element={<RouteWrapper><Blog /></RouteWrapper>} />
      <Route path="/blog/:slug" element={<RouteWrapper><BlogPost /></RouteWrapper>} />
      <Route path="/lesson-plans" element={<RouteWrapper><LessonPlans /></RouteWrapper>} />
      <Route path="/lesson-plans/:slug" element={<RouteWrapper><LessonPlan /></RouteWrapper>} />
      <Route path="/worksheets" element={<RouteWrapper><Worksheets /></RouteWrapper>} />
      <Route path="/worksheets/:slug" element={<RouteWrapper><Worksheet /></RouteWrapper>} />
      <Route path="/builder" element={<RouteWrapper><Builder /></RouteWrapper>} />
      <Route path="/events" element={<RouteWrapper><Events /></RouteWrapper>} />
      <Route path="/events/:slug" element={<RouteWrapper><EventDetail /></RouteWrapper>} />
      <Route path="/contact" element={<RouteWrapper><Contact /></RouteWrapper>} />
      <Route path="/faq" element={<RouteWrapper><FAQ /></RouteWrapper>} />
      <Route path="/edutech" element={<RouteWrapper><Edutech /></RouteWrapper>} />
      <Route path="/teacher-diary" element={<RouteWrapper><TeacherDiary /></RouteWrapper>} />
      <Route path="/teacher-diary/:slug" element={<RouteWrapper><TeacherDiaryEntry /></RouteWrapper>} />
      <Route path="/auth" element={<RouteWrapper><Auth /></RouteWrapper>} />
      <Route path="/account" element={<RouteWrapper><Account /></RouteWrapper>} />
      <Route path="/sitemap" element={<RouteWrapper><Sitemap /></RouteWrapper>} />
      
      {/* Localized routes for Albanian and Vietnamese */}
      <Route path="/:lang">
        <Route index element={<RouteWrapper><Index /></RouteWrapper>} />
        <Route path="about" element={<RouteWrapper><About /></RouteWrapper>} />
        <Route path="services" element={<RouteWrapper><Services /></RouteWrapper>} />
        <Route path="blog" element={<RouteWrapper><Blog /></RouteWrapper>} />
        <Route path="blog/:slug" element={<RouteWrapper><BlogPost /></RouteWrapper>} />
        <Route path="lesson-plans" element={<RouteWrapper><LessonPlans /></RouteWrapper>} />
        <Route path="lesson-plans/:slug" element={<RouteWrapper><LessonPlan /></RouteWrapper>} />
        <Route path="worksheets" element={<RouteWrapper><Worksheets /></RouteWrapper>} />
        <Route path="worksheets/:slug" element={<RouteWrapper><Worksheet /></RouteWrapper>} />
        <Route path="builder" element={<RouteWrapper><Builder /></RouteWrapper>} />
        <Route path="events" element={<RouteWrapper><Events /></RouteWrapper>} />
        <Route path="events/:slug" element={<RouteWrapper><EventDetail /></RouteWrapper>} />
        <Route path="contact" element={<RouteWrapper><Contact /></RouteWrapper>} />
        <Route path="faq" element={<RouteWrapper><FAQ /></RouteWrapper>} />
        <Route path="edutech" element={<RouteWrapper><Edutech /></RouteWrapper>} />
        <Route path="teacher-diary" element={<RouteWrapper><TeacherDiary /></RouteWrapper>} />
        <Route path="teacher-diary/:slug" element={<RouteWrapper><TeacherDiaryEntry /></RouteWrapper>} />
        <Route path="auth" element={<RouteWrapper><Auth /></RouteWrapper>} />
        <Route path="account" element={<RouteWrapper><Account /></RouteWrapper>} />
        <Route path="sitemap" element={<RouteWrapper><Sitemap /></RouteWrapper>} />
      </Route>
      
      <Route path="*" element={<RouteWrapper><NotFound /></RouteWrapper>} />
    </Routes>
  );
};