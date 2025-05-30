import React from 'react';

const TestAdminPage = () => {
  console.log('TestAdminPage rendering');
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh' }}>
      <h1 style={{ color: 'green' }}>Test Admin Page Works!</h1>
      <p>If you can see this, React is working.</p>
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
        Current timestamp: {new Date().toISOString()}
      </div>
    </div>
  );
};

export default TestAdminPage;