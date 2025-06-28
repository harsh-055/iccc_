import React from 'react';
import { NextPageContext } from 'next';

interface ErrorPageProps {
  statusCode: number;
}

function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <div style={{ textAlign: "center", padding: "20px", background: "#ffdddd", color: "#d32f2f" }}>
      <h1>Something went wrong!</h1>
      <p>{statusCode ? `Error ${statusCode}` : "An unexpected error occurred."}</p>
      <button onClick={() => window.location.reload()}>Reload Page</button>
    </div>
  );
}

ErrorPage.getInitialProps = async ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
  