import React from 'react';

const Navbar = () => {
  return (
    <>
      <div className='main-navbar'>
        <div className='navbar1'>
          <h1>INTO-PDF</h1>
          <h1 style={{ cursor: "pointer" }} onClick={() => window.location.reload()}>
            Home
          </h1>
        </div>
      </div>
    </>
  );
};

export default Navbar;
