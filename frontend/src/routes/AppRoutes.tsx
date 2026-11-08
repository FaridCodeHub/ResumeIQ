import { Routes, Route } from 'react-router-dom';

import App from '../App';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

import DashboardLayout from '../components/layout/DashboardLayout';
import PagePlaceholder from '../components/dashboard/PagePlaceholder';
import ProtectedRoute from '../components/auth/ProtectedRoute';

import DashboardHome from '../pages/dashboard/DashboardHome';
import ResumeUpload from '../pages/ResumeUpload';
function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Dashboard Pages */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={
            <DashboardLayout pageTitle="Overview">
              <DashboardHome />
            </DashboardLayout>
          }
        />

        <Route
          path="/resumes"
          element={
            <DashboardLayout pageTitle="My Resumes">
              <PagePlaceholder
                title="My Resumes"
                description="Manage and review your uploaded resumes here."
              />
            </DashboardLayout>
          }
        />
        <Route
          path="/upload-resume"
          element={
            <DashboardLayout pageTitle="Upload Resume">
              <ResumeUpload onBack={() => window.history.back()} />
            </DashboardLayout>
          }
        />
        <Route
          path="/jobs"
          element={
            <DashboardLayout pageTitle="Job Descriptions">
              <PagePlaceholder
                title="Job Descriptions"
                description="Add and manage job descriptions for resume analysis."
              />
            </DashboardLayout>
          }
        />

        <Route
          path="/analysis"
          element={
            <DashboardLayout pageTitle="Resume Analysis">
              <PagePlaceholder
                title="Resume Analysis"
                description="Analyze your resume against a selected job description."
              />
            </DashboardLayout>
          }
        />

        <Route
          path="/ats"
          element={
            <DashboardLayout pageTitle="ATS Analysis">
              <PagePlaceholder
                title="ATS Analysis"
                description="Review ATS compatibility and resume quality."
              />
            </DashboardLayout>
          }
        />

        <Route
          path="/skills"
          element={
            <DashboardLayout pageTitle="Skill Gap Analysis">
              <PagePlaceholder
                title="Skill Gap Analysis"
                description="Identify missing skills and areas for improvement."
              />
            </DashboardLayout>
          }
        />

        <Route
          path="/careers"
          element={
            <DashboardLayout pageTitle="Career Recommendations">
              <PagePlaceholder
                title="Career Recommendations"
                description="Explore career paths based on your skills and experience."
              />
            </DashboardLayout>
          }
        />

        <Route
          path="/history"
          element={
            <DashboardLayout pageTitle="Analysis History">
              <PagePlaceholder
                title="Analysis History"
                description="Review your previous resume analyses."
              />
            </DashboardLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <DashboardLayout pageTitle="Settings">
              <PagePlaceholder
                title="Settings"
                description="Manage your account and application preferences."
              />
            </DashboardLayout>
          }
        />
      </Route>
    </Routes>
  );
}

export default AppRoutes;