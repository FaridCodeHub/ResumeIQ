import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/login': 'Login',
  '/register': 'Register',
  '/forgot-password': 'Forgot Password',
  '/dashboard': 'Dashboard',
  '/resumes': 'My Resumes',
  '/upload-resume': 'Upload Resume',
  '/jobs': 'Job Descriptions',
  '/analysis': 'New Analysis',
  '/ats': 'ATS Analysis',
  '/skills': 'Skill Gap Analysis',
  '/careers': 'Career Recommendations',
  '/history': 'Analysis History',
  '/settings': 'Settings',
};

function PageTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    const title =
      pageTitles[path] ||
      (path.startsWith('/analysis/') ? 'Analysis Results' : 'ResumeIQ');

    document.title = `ResumeIQ | ${title}`;
  }, [location.pathname]);

  return null;
}

export default PageTitle;