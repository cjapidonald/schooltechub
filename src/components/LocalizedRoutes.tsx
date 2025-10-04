import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Index from '@/pages/Index';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Services from '@/pages/Services';
import Blog from '@/pages/Blog';
import BlogPost from '@/pages/BlogPost';
import Resources from '@/pages/resources';
import Events from '@/pages/Events';
import EventDetail from '@/pages/EventDetail';
import Contact from '@/pages/Contact';
import FAQ from '@/pages/FAQ';
import BuilderLessonPlan from '@/pages/BuilderLessonPlan';
import BuilderLessonPlanDetail from '@/pages/BuilderLessonPlanDetail';
import Auth from '@/pages/Auth';
import Account from '@/pages/account';
import ClassDashboard from '@/pages/account/ClassDashboard';
import AccountResources from '@/pages/AccountResources';
import AccountResourceNew from '@/pages/AccountResourceNew';
import AccountResourceEdit from '@/pages/AccountResourceEdit';
import LessonBuilderPage from '@/pages/lesson-builder/LessonBuilderPage';
import AuthGuard from '@/components/auth/AuthGuard';
import NotFound from '@/pages/NotFound';
import Sitemap from '@/pages/Sitemap';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminPage from '@/pages/admin/AdminPage';

const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navigation />
    {children}
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
      <Route path="/home" element={<RouteWrapper><Home /></RouteWrapper>} />
      <Route path="/about" element={<RouteWrapper><About /></RouteWrapper>} />
      <Route path="/services" element={<RouteWrapper><Services /></RouteWrapper>} />
      <Route path="/blog" element={<RouteWrapper><Blog /></RouteWrapper>} />
      <Route path="/blog/:slug" element={<RouteWrapper><BlogPost /></RouteWrapper>} />
      <Route
        path="/builder/lesson-plans"
        element={
          <RouteWrapper>
            <AuthGuard>
              <BuilderLessonPlan />
            </AuthGuard>
          </RouteWrapper>
        }
      />
      <Route
        path="/builder/lesson-plans/:id"
        element={
          <RouteWrapper>
            <AuthGuard>
              <BuilderLessonPlanDetail />
            </AuthGuard>
          </RouteWrapper>
        }
      />
      <Route path="/lesson-plans/builder" element={<LegacyBuilderRedirect />} />
      <Route path="/lesson-plans/builder/:id" element={<LegacyBuilderRedirect />} />
      <Route
        path="/lesson-builder"
        element={
          <RouteWrapper>
            <AuthGuard>
              <LessonBuilderPage />
            </AuthGuard>
          </RouteWrapper>
        }
      />
      <Route path="/resources" element={<RouteWrapper><Resources /></RouteWrapper>} />
      <Route path="/events" element={<RouteWrapper><Events /></RouteWrapper>} />
      <Route path="/events/:slug" element={<RouteWrapper><EventDetail /></RouteWrapper>} />
      <Route path="/contact" element={<RouteWrapper><Contact /></RouteWrapper>} />
      <Route path="/faq" element={<RouteWrapper><FAQ /></RouteWrapper>} />
      <Route path="/auth" element={<RouteWrapper><Auth /></RouteWrapper>} />
      <Route
        path="/account"
        element={
          <RouteWrapper>
            <AuthGuard>
              <Account />
            </AuthGuard>
          </RouteWrapper>
        }
      />
      <Route
        path="/account/classes/:id"
        element={
          <RouteWrapper>
            <AuthGuard>
              <ClassDashboard />
            </AuthGuard>
          </RouteWrapper>
        }
      />
      <Route
        path="/account/resources"
        element={
          <RouteWrapper>
            <AuthGuard>
              <AccountResources />
            </AuthGuard>
          </RouteWrapper>
        }
      />
      <Route
        path="/account/resources/new"
        element={
          <RouteWrapper>
            <AuthGuard>
              <AccountResourceNew />
            </AuthGuard>
          </RouteWrapper>
        }
      />
      <Route
        path="/account/resources/:id"
        element={
          <RouteWrapper>
            <AuthGuard>
              <AccountResourceEdit />
            </AuthGuard>
          </RouteWrapper>
        }
      />
      <Route path="/sitemap" element={<RouteWrapper><Sitemap /></RouteWrapper>} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminPage />} />
        <Route path=":segment" element={<AdminPage />} />
        <Route path=":segment/:subSegment" element={<AdminPage />} />
        <Route path=":segment/:subSegment/:child" element={<AdminPage />} />
      </Route>

      <Route path="/sq" element={<Navigate to="/" replace />} />
      <Route path="/sq/*" element={<Navigate to="/" replace />} />
      <Route path="/vi" element={<Navigate to="/" replace />} />
      <Route path="/vi/*" element={<Navigate to="/" replace />} />

      <Route path="*" element={<RouteWrapper><NotFound /></RouteWrapper>} />
    </Routes>
  );
};