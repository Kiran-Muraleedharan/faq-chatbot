import React from 'react';
import { Route, Routes } from 'react-router-dom';
// Remove the curly braces around HomePage
import {HomePage} from './HomePage'; 

const App = () => {
  return (
    <div>
      <Routes>
        <Route index element={<HomePage />} />
        {/* Add more routes here if needed */}
      </Routes>
    </div>
  );
};

export { App };