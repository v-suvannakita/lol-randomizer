import React, { memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import InitiatePlayer from './InitiatePlayer';
import Randomizer from './Randomizer';
import MatchHistory from './MatchHistory';

const MemoInitiatePlayer = memo(InitiatePlayer);
const MemoRandomizer = memo(Randomizer);
const MemoMatchHistory = memo(MatchHistory);

function App() {
  return (
    <Router>
      <nav style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
        background: '#222',
        color: '#fff',
        padding: 18,
        fontFamily: 'Montserrat, Arial, sans-serif',
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: 2,
        boxShadow: '0 2px 8px #0008'
      }}>
        <Link to="/" style={{ color: '#00ffa3', fontWeight: 900, fontSize: 20, textDecoration: 'none' }}>Randomizer</Link>
        <Link to="/history" style={{ color: '#00d8ff', fontWeight: 900, fontSize: 20, textDecoration: 'none' }}>Match History</Link>
        <Link to="/initiate" style={{ color: '#fff', fontWeight: 900, fontSize: 20, textDecoration: 'none' }}>Initiate Player</Link>
      </nav>
      <div
        style={{
          padding: 20,
          textAlign: 'center',
          width: '100%',
          maxWidth: '3000px',
          margin: '0 auto',
          fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif'
        }}
      >
        <style>
          {`
            table {
              border-collapse: separate !important;
              border-spacing: 0 !important;
              font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif !important;
              font-size: 17px !important;
              background: #232526 !important;
              border-radius: 24px !important;
              overflow: hidden !important;
              box-shadow: 0 8px 32px #000b, 0 1.5px 0 #00ffa355 !important;
              margin-bottom: 24px;
            }
            th, td {
              border-right: 2px solid #00ffa355 !important;
              padding: 14px 0 14px 18px !important;
              text-align: center !important;
              font-weight: 700 !important;
              color: #fff !important;
              background: #18191a !important;
              vertical-align: middle !important;
            }
            th.special, td.special {
              background: #18191a !important;
              color: #00ffa3 !important;
              font-size: 20px !important;
              font-weight: 900 !important;
              letter-spacing: 1.5px !important;
              box-shadow: 0 2px 8px #00ffa344 !important;
              border-right: 2.5px solid #00ffa3 !important;
            }
            th.special.name, td.special.name {
              min-width: 180px !important;
              max-width: 220px !important;
              width: 200px !important;
            }
            th.special.overall, td.special.overall {
              min-width: 100px !important;
              max-width: 120px !important;
              width: 110px !important;
            }
            th.top, td.top,
            th.jungle, td.jungle,
            th.mid, td.mid,
            th.adc, td.adc,
            th.sup, td.sup {
              min-width: 70px !important;
              max-width: 90px !important;
              width: 80px !important;
            }
            th.actions, td.actions {
              min-width: 90px !important;
              max-width: 120px !important;
              width: 100px !important;
            }
            th {
              color: #00ffa3 !important;
              font-size: 19px !important;
              letter-spacing: 1px !important;
              background: #18191a !important;
              box-shadow: 0 2px 8px #00ffa344 !important;
            }
            tr {
              transition: background 0.2s;
            }
            tr:hover {
              background: #00ffa322 !important;
            }
            td {
              background: #232526 !important;
              font-size: 17px !important;
              font-weight: 700 !important;
            }
          `}
        </style>
        <Routes>
          <Route path="/" element={<MemoRandomizer />} />
          <Route path="/history" element={<MemoMatchHistory />} />
          <Route path="/initiate" element={<MemoInitiatePlayer />} />
        </Routes>
      </div>
      <style>
        {`
          @media (max-width: 1800px) {
            div[style*="width: 100%"] {
              width: 98% !important;
              padding: 8px !important;
            }
          }
        `}
      </style>
    </Router>
  );
}

export default App;