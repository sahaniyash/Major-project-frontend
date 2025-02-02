import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Components from './Components';  // Assuming you have this as a separate component set

const SignInSignUp = () => {
  const [signIn, toggle] = useState(true);
  const navigate = useNavigate();

  const handleSignUp = () => {
    // Handle the sign-up logic here
    // After successful sign-up, navigate to the charts page
    navigate('/charts');
  };

  const handleSignIn = () => {
    // Handle the sign-in logic here
    // After successful sign-in, navigate to the charts page
    navigate('/charts');
  };

  return (
    <Components.Container>
      <Components.SignUpContainer signinIn={signIn}>
        <Components.Form>
          <Components.Title>Create Account</Components.Title>
          <Components.Input type='text' placeholder='Name' />
          <Components.Input type='email' placeholder='Email' />
          <Components.Input type='password' placeholder='Password' />
          <Components.Button onClick={handleSignUp}>Sign Up</Components.Button>
        </Components.Form>
      </Components.SignUpContainer>

      <Components.SignInContainer signinIn={signIn}>
        <Components.Form>
          <Components.Title>Sign in</Components.Title>
          <Components.Input type='email' placeholder='Email' />
          <Components.Input type='password' placeholder='Password' />
          <Components.Anchor href='#'>Forgot your password?</Components.Anchor>
          <Components.Button onClick={handleSignIn}>Sign In</Components.Button>
        </Components.Form>
      </Components.SignInContainer>

      <Components.OverlayContainer signinIn={signIn}>
        <Components.Overlay signinIn={signIn}>
          <Components.LeftOverlayPanel signinIn={signIn}>
            <Components.Title>Welcome Back!</Components.Title>
            <Components.Paragraph>
              To keep connected with us please login with your personal info
            </Components.Paragraph>
            <Components.GhostButton onClick={() => toggle(true)}>
              Sign In
            </Components.GhostButton>
          </Components.LeftOverlayPanel>

          <Components.RightOverlayPanel signinIn={signIn}>
            <Components.Title>Hello, Friend!</Components.Title>
            <Components.Paragraph>
              Enter Your personal details and start journey with us
            </Components.Paragraph>
            <Components.GhostButton onClick={() => toggle(false)}>
              Sign Up
            </Components.GhostButton>
          </Components.RightOverlayPanel>
        </Components.Overlay>
      </Components.OverlayContainer>
    </Components.Container>
  );
};

export default SignInSignUp;
