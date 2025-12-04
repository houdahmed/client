import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Spinner = ({path = 'login'}) => {
  const navigate = useNavigate();
  const [count, setCount] = useState(3);
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prevCount) => --prevCount);
    }, 1000);
    //redirect when count is 0
    count === 0 &&
      navigate(`/${path}`, {
        state: location.pathname,
      });
    return () => clearInterval(interval);
  }, [count, navigate, location, path]);

  return (
    <>
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <h1 className="text-center">Redirecting you in {count} seconds...</h1>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </>
  );
};

export default Spinner;
