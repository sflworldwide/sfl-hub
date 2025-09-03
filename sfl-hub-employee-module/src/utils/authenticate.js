import React from "react";
import { Route, Redirect } from "react-router-dom";
export const getAccessToken = () => localStorage.getItem("loggedInUserData");
// export const getAccessToken = () => sessionStorage.getItem('loggedInUserData');
export const isAuthenticated = () => !!getAccessToken();

export const UnauthenticatedRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={(props) => ((
      // !isAuthenticated()
      //     ?
      <Component
        {...props}
      /> /*: <Redirect to='/auth/login-page' />*/ /*: <Redirect to='/auth/login-page' />*/ /*: <Redirect to='/auth/login-page' />*/
      // : <Redirect to='/auth/login-page' />
    ) /*: <Redirect to='/auth/login-page' />*/)}
  />
);

export const AuthenticatedRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={(props) =>
      isAuthenticated() ? (
        <Component {...props} />
      ) : window.location.href.includes("GetQuote") ? (
        <Redirect from="/" to="/auth/get-quote" />
      ) : (
        <Redirect from="/" to="/auth/login-page" />
      )
    }
  />
);
