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
import AdminLayout from '@/features/admin/components/AdminLayout';
import AdminGuard from '@/features/admin/components/AdminGuard';
import { AdminDashboard } from '@/features/admin/pages/AdminDashboard';
import AdminSection from '@/features/admin/components/AdminSection';
import { ADMIN_ROUTE_META } from '@/features/admin/constants/routes';

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
  const renderAdminSection = (path: string, tableColumns?: string[]) => {
    const meta = ADMIN_ROUTE_META[path];

    if (!meta) {
      return (
        <AdminSection
          title="Admin"
          description="Administrative workspace."
          tableColumns={tableColumns}
        />
      );
    }

    return (
      <AdminSection
        title={meta.title}
        description={meta.description}
        tableColumns={tableColumns}
      />
    );
  };

  return (
    <Routes>
      <Route
        path="/admin"
        element={(
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        )}
      >
        <Route index element={<AdminDashboard />} />
        <Route path="moderation">
          <Route index element={renderAdminSection('/admin/moderation')} />
          <Route
            path="resources"
            element={renderAdminSection('/admin/moderation/resources')}
          />
          <Route
            path="blogposts"
            element={renderAdminSection('/admin/moderation/blogposts')}
          />
          <Route
            path="research-applications"
            element={renderAdminSection('/admin/moderation/research-applications')}
          />
          <Route
            path="comments"
            element={renderAdminSection('/admin/moderation/comments')}
          />
        </Route>
        <Route path="content">
          <Route index element={renderAdminSection('/admin/content')} />
          <Route path="posts" element={renderAdminSection('/admin/content/posts')} />
          <Route
            path="resources"
            element={renderAdminSection('/admin/content/resources')}
          />
        </Route>
        <Route path="users">
          <Route index element={renderAdminSection('/admin/users')} />
          <Route
            path="directory"
            element={renderAdminSection('/admin/users/directory')}
          />
          <Route
            path="invitations"
            element={renderAdminSection('/admin/users/invitations')}
          />
          <Route path="roles" element={renderAdminSection('/admin/users/roles')} />
        </Route>
        <Route path="research">
          <Route index element={renderAdminSection('/admin/research')} />
          <Route
            path="projects"
            element={renderAdminSection('/admin/research/projects')}
          />
          <Route
            path="documents"
            element={renderAdminSection('/admin/research/documents')}
          />
          <Route
            path="participants"
            element={renderAdminSection('/admin/research/participants')}
          />
          <Route
            path="submissions"
            element={renderAdminSection('/admin/research/submissions')}
          />
        </Route>
        <Route path="system">
          <Route index element={renderAdminSection('/admin/system')} />
          <Route
            path="notifications"
            element={renderAdminSection('/admin/system/notifications')}
          />
          <Route
            path="audit-log"
            element={renderAdminSection('/admin/system/audit-log')}
          />
          <Route
            path="settings"
            element={renderAdminSection('/admin/system/settings')}
          />
        </Route>
      </Route>
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