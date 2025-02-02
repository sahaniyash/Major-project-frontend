import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignInSignUp from './SignInSignUp';  // Your SignIn/SignUp component
import GraphFromCSV from './GraphFromCSV';  // Your charts component

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Root route rendering SignInSignUp */}
        <Route path="/" element={<SignInSignUp />} />

        {/* Route for the charts page */}
        <Route path="/charts" element={<GraphFromCSV />} />
        
        {/* Catch-all route to redirect to the sign-in page */}
        <Route path="*" element={<SignInSignUp />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
