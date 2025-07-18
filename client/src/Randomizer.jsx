import React, { useEffect, useState } from 'react';

// Helper to assign roles for balancing
function assignRolesAndBalance(players) {
  const roles = ['top', 'jungle', 'mid', 'adc', 'sup'];
  if (players.length < 10) return { team1: [], team2: [] };

  // Only consider players with at least one role > 0
  const available = players.map(p => ({
    ...p,
    availableRoles: roles.filter(role => p[role] > 0)
  }));

  // Try to assign each role to two different players (one per team), only if they have >0 in that role
  let usedIds = new Set();
  let team1 = [];
  let team2 = [];

  for (let role of roles) {
    // Only consider players with score > 0 for this role and not already assigned
    const candidates = available.filter(p => !usedIds.has(p.id) && p[role] > 0);
    if (candidates.length < 2) {
      // Not enough candidates for this role, cannot assign both teams uniquely
      return { team1: [], team2: [] };
    }
    // Sort by score DESC for this role
    const sorted = [...candidates].sort((a, b) => b[role] - a[role]);
    // Randomize assignment for fairness
    if (Math.random() < 0.5) {
      team1.push({ ...sorted[0], assignedRole: role, assignedScore: sorted[0][role] });
      team2.push({ ...sorted[1], assignedRole: role, assignedScore: sorted[1][role] });
      usedIds.add(sorted[0].id);
      usedIds.add(sorted[1].id);
    } else {
      team1.push({ ...sorted[1], assignedRole: role, assignedScore: sorted[1][role] });
      team2.push({ ...sorted[0], assignedRole: role, assignedScore: sorted[0][role] });
      usedIds.add(sorted[0].id);
      usedIds.add(sorted[1].id);
    }
  }

  // Only keep 5 per team, each with unique role (guaranteed by above)
  team1 = team1.slice(0, 5);
  team2 = team2.slice(0, 5);

  // Calculate team sum only for assigned roles with score > 0
  function teamSum(team) {
    return team.reduce((a, b) => {
      const score = (parseInt(b.assignedScore) >= 1) ? parseInt(b.assignedScore) : 0;
      return a + score;
    }, 0);
  }
  let diff = Math.abs(teamSum(team1) - teamSum(team2));

  function trySwapRole(role) {
    let changed = false;
    for (let i = 0; i < team1.length; i++) {
      for (let j = 0; j < team2.length; j++) {
        if (team1[i].assignedRole !== role || team2[j].assignedRole !== role) continue;
        // Only swap if both have score > 0 for this role
        if ((parseInt(team1[i][role]) || 0) <= 0 || (parseInt(team2[j][role]) || 0) <= 0) continue;
        let t1 = [...team1];
        let t2 = [...team2];
        [t1[i], t2[j]] = [t2[j], t1[i]];
        let newDiff = Math.abs(teamSum(t1) - teamSum(t2));
        if (newDiff < diff) {
          team1 = t1;
          team2 = t2;
          diff = newDiff;
          changed = true;
        }
        // Stop early if within current threshold
        if (diff <= currentThreshold) return true;
      }
      if (diff <= currentThreshold) return true;
    }
    return changed;
  }

  // Try thresholds: 3, then 5, then 7
  let thresholds = [3, 5, 7];
  let balanced = false;
  let currentThreshold = thresholds[0];

  for (let t = 0; t < thresholds.length; t++) {
    currentThreshold = thresholds[t];
    let localChanged = true;
    diff = Math.abs(teamSum(team1) - teamSum(team2));
    // Try to swap roles to balance within current threshold
    while (diff > currentThreshold && localChanged) {
      localChanged = false;
      localChanged = trySwapRole('adc') || localChanged;
      if (diff <= currentThreshold) break;
      localChanged = trySwapRole('sup') || localChanged;
      if (diff <= currentThreshold) break;
      for (let role of ['top', 'jungle', 'mid']) {
        localChanged = trySwapRole(role) || localChanged;
        if (diff <= currentThreshold) break;
      }
    }
    diff = Math.abs(teamSum(team1) - teamSum(team2));
    if (diff <= currentThreshold) {
      balanced = true;
      break;
    }
  }

  // If still cannot balance, just return the teams as is (no alert)
  return { team1, team2 };
}

function Randomizer() {
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState([]); // used for next steps
  const [step, setStep] = useState(1);
  const [teams, setTeams] = useState({ team1: [], team2: [] });
  const [countdown, setCountdown] = useState(5);
  const [winner, setWinner] = useState(null);
  const [balanceMode, setBalanceMode] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [history, setHistory] = useState([]);

  // --- Session restore logic using server session.txt ---
  useEffect(() => {
    fetch('/api/session')
      .then(res => res.ok ? res.json() : null)
      .then(session => {
        if (
          session &&
          session.step === 3 &&
          session.teams &&
          Array.isArray(session.teams.team1) &&
          Array.isArray(session.teams.team2) &&
          session.teams.team1.length === 5 &&
          session.teams.team2.length === 5
        ) {
          setStep(3);
          setTeams(session.teams);
          setSelected(session.selected || []);
          setSelectedIds(session.selectedIds || []);
          setBalanceMode(session.balanceMode !== undefined ? session.balanceMode : true);
        }
      })
      .catch(() => {});
  }, []);

  // Save session when teams are set and step is 3
  useEffect(() => {
    if (step === 3 && teams.team1.length === 5 && teams.team2.length === 5) {
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          teams,
          selected,
          selectedIds,
          balanceMode
        })
      });
    }
  }, [step, teams, selected, selectedIds, balanceMode]);

  // Clear session when match is finished (step 4 or reset)
  useEffect(() => {
    if (step === 4 || step === 1) {
      fetch('/api/session', { method: 'DELETE' });
    }
  }, [step]);

  // Fetch players
  useEffect(() => {
    fetch('/api/players').then(res => res.json()).then(setPlayers);
  }, []);

  // Refresh players after match result and redirect to main page
  useEffect(() => {
    if (step === 1) {
      fetch('/api/players').then(res => res.json()).then(setPlayers);
    }
  }, [step]);

  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (step === 2 && countdown === 0) {
      handleRandomize();
    }
  }, [step, countdown]);

  // Only allow selecting players who have at least one role > 0
  const selectablePlayers = players.filter(
    p => ['top', 'jungle', 'mid', 'adc', 'sup'].some(role => p[role] > 0)
  );

  const handleSelect = (id) => {
    setSelected(sel =>
      sel.includes(id)
        ? sel.filter(sid => sid !== id)
        : sel.length < 10
          ? [...sel, id]
          : sel
    );
  };

  const handleNext = () => {
    if (selected.length === 10) {
      setStep(2);
      setCountdown(5); // always 5 sec
    }
  };

  // Step 3: Randomize teams with role assignment and balancing
  const handleRandomize = () => {
    const selectedPlayers = players.filter(p => selected.includes(p.id));
    let team1 = [], team2 = [];
    if (balanceMode) {
      const result = assignRolesAndBalance(selectedPlayers);
      // Fix: If result.team1 or team2 is empty, fallback to random split (so UI always shows something)
      if (result.team1.length === 5 && result.team2.length === 5) {
        team1 = result.team1;
        team2 = result.team2;
      } else {
        // fallback: random split, assign only roles with score > 0
        const roles = ['top', 'jungle', 'mid', 'adc', 'sup'];
        const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
        team1 = [];
        team2 = [];
        const usedRoles1 = new Set();
        const usedRoles2 = new Set();
        for (let i = 0; i < 5; i++) {
          const p1 = shuffled[i];
          const availableRoles1 = roles.filter(role => p1[role] > 0 && !usedRoles1.has(role));
          const assignedRole1 = availableRoles1.length
            ? availableRoles1[Math.floor(Math.random() * availableRoles1.length)]
            : null;
          team1.push(
            assignedRole1
              ? { ...p1, assignedRole: assignedRole1, assignedScore: p1[assignedRole1] }
              : { ...p1, assignedRole: '', assignedScore: 0 }
          );
          if (assignedRole1) usedRoles1.add(assignedRole1);

          const p2 = shuffled[i + 5];
          const availableRoles2 = roles.filter(role => p2[role] > 0 && !usedRoles2.has(role));
          const assignedRole2 = availableRoles2.length
            ? availableRoles2[Math.floor(Math.random() * availableRoles2.length)]
            : null;
          team2.push(
            assignedRole2
              ? { ...p2, assignedRole: assignedRole2, assignedScore: p2[assignedRole2] }
              : { ...p2, assignedRole: '', assignedScore: 0 }
          );
          if (assignedRole2) usedRoles2.add(assignedRole2);
        }
      }
    } else {
      // Unbalanced: just random split, assign random roles (not best role)
      const roles = ['top', 'jungle', 'mid', 'adc', 'sup'];
      const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
      team1 = shuffled.slice(0, 5).map(p => {
        const availableRoles = roles.filter(role => p[role] > 0);
        const assignedRole = availableRoles.length
          ? availableRoles[Math.floor(Math.random() * availableRoles.length)]
          : null;
        return assignedRole
          ? { ...p, assignedRole, assignedScore: p[assignedRole] }
          : { ...p, assignedRole: '', assignedScore: 0 };
      });
      team2 = shuffled.slice(5, 10).map(p => {
        const availableRoles = roles.filter(role => p[role] > 0);
        const assignedRole = availableRoles.length
          ? availableRoles[Math.floor(Math.random() * availableRoles.length)]
          : null;
        return assignedRole
          ? { ...p, assignedRole, assignedScore: p[assignedRole] }
          : { ...p, assignedRole: '', assignedScore: 0 };
      });
    }
    setTeams({ team1, team2 });
    setStep(3);
  };

  // Fetch match history after result
  useEffect(() => {
    if (step === 4) {
      fetch('/api/match-history')
        .then(res => res.json())
        .then(setHistory);
    }
  }, [step]);

  // --- Winner logic: increase score for the role played ---
  // Now also decrease score for the losing team, and clamp between 1 and 10
  const handlePickWinner = async (team) => {
    setWinner(team);
    const winnerPlayers = teams[team];
    const loserTeam = team === "team1" ? "team2" : "team1";
    const loserPlayers = teams[loserTeam];

    // Prepare detailed player info for match history
    const detailedTeam1 = [];
    const detailedTeam2 = [];

    // Winner: +1 to assigned role, max 10, min 1
    for (const p of winnerPlayers) {
      if (!p.assignedRole) continue;
      const oldScore = parseInt(p[p.assignedRole]) || 1;
      const newScore = Math.min(10, Math.max(1, oldScore + 1));
      await fetch(`/api/players/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [p.assignedRole]: newScore })
      });
      detailedTeam1.push({
        ...p,
        assignedRole: p.assignedRole,
        oldScore,
        newScore
      });
    }
    // Loser: -1 to assigned role, max 10, min 1
    for (const p of loserPlayers) {
      if (!p.assignedRole) continue;
      const oldScore = parseInt(p[p.assignedRole]) || 1;
      const newScore = Math.min(10, Math.max(1, oldScore - 1));
      await fetch(`/api/players/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [p.assignedRole]: newScore })
      });
      detailedTeam2.push({
        ...p,
        assignedRole: p.assignedRole,
        oldScore,
        newScore
      });
    }

    // --- Save match history with detailed info ---
    await fetch('/api/match-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        winner: team,
        loser: loserTeam,
        teams: team === "team1"
          ? { team1: detailedTeam1, team2: detailedTeam2 }
          : { team1: detailedTeam2, team2: detailedTeam1 },
        timestamp: Date.now()
      })
    });

    setStep(4);
  };

  const handleNextMatch = () => {
    setSelected([]);
    setStep(1);
    setTeams({ team1: [], team2: [] });
    setWinner(null);
  };

  // --- UI for each step ---
  if (step === 1) {
    // Move handleRowSelect, handleNextRows outside of render
    const selectedCount = selectedIds.length;

    const handleRowSelect = (id) => {
      setSelectedIds(prev =>
        prev.includes(id)
          ? prev.filter(sid => sid !== id)
          : prev.length < 10
            ? [...prev, id]
            : prev
      );
    };

    const handleNextRows = () => {
      if (selectedCount === 10) {
        setSelected(selectedIds); // this is the key: update main selected state
        setStep(2);
        setCountdown(5);
      }
    };

    return (
      <div style={{
        background: 'rgba(30,32,34,0.98)',
        borderRadius: 24,
        boxShadow: '0 8px 32px #000b, 0 1.5px 0 #00ffa355',
        padding: 36,
        margin: '40px auto',
        width: '95vw',
        maxWidth: 900,
        border: '1.5px solid #00ffa355'
      }}>
        <h2 style={{
          color: '#00ffa3',
          fontWeight: 900,
          fontSize: 32,
          marginBottom: 24,
          letterSpacing: 2,
          textAlign: 'center',
          textShadow: '0 2px 8px #00ffa344'
        }}>Select 10 Players</h2>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <label style={{
            color: '#00ffa3',
            fontWeight: 700,
            fontSize: 18,
            marginRight: 16,
            letterSpacing: 1
          }}>
            <input
              type="checkbox"
              checked={balanceMode}
              onChange={e => setBalanceMode(e.target.checked)}
              style={{ marginRight: 8, accentColor: '#00ffa3' }}
            />
            Balance teams by score
          </label>
          <span style={{ color: '#aaa', fontSize: 15 }}>
            {balanceMode
              ? 'Teams will be balanced by role and score'
              : 'Teams will be assigned randomly (no balancing)'}
          </span>
        </div>
        <table
          style={{
            margin: '0 auto',
            background: '#232526',
            borderRadius: 12,
            boxShadow: '0 2px 16px #000a',
            color: '#fff',
            minWidth: 800,
            width: '100%',
            fontSize: 17,
            border: 'none'
          }}
        >
          <thead>
            <tr>
              <th className="special name">Name</th>
              <th className="top">Top</th>
              <th className="jungle">Jungle</th>
              <th className="mid">Mid</th>
              <th className="adc">ADC</th>
              <th className="sup">SUP</th>
              <th className="actions">Select</th>
            </tr>
          </thead>
          <tbody>
            {players
              .filter(p => p.name && p.name.toLowerCase() !== 'name')
              .map(p => (
                <tr key={p.id} style={{
                  background: selectedIds.includes(p.id) ? '#00ffa322' : undefined,
                  fontWeight: selectedIds.includes(p.id) ? 700 : 400
                }}>
                  <td className="special name">{p.name}</td>
                  <td className="top">{p.top}</td>
                  <td className="jungle">{p.jungle}</td>
                  <td className="mid">{p.mid}</td>
                  <td className="adc">{p.adc}</td>
                  <td className="sup">{p.sup}</td>
                  <td className="actions">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => handleRowSelect(p.id)}
                      disabled={
                        (!selectedIds.includes(p.id) && selectedCount >= 10)
                      }
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <div style={{ marginTop: 16, color: '#00ffa3', fontWeight: 700 }}>
          Selected: {selectedCount} / 10
        </div>
        <button
          style={{
            marginTop: 32,
            background: selectedCount === 10 ? 'linear-gradient(90deg, #00ffa3 0%, #00d8ff 100%)' : '#444',
            color: '#222',
            border: 'none',
            borderRadius: 12,
            padding: '12px 36px',
            fontWeight: 900,
            fontSize: 20,
            cursor: selectedCount === 10 ? 'pointer' : 'not-allowed',
            boxShadow: '0 2px 8px #00ffa344',
            transition: 'background 0.2s, color 0.2s'
          }}
          disabled={selectedCount !== 10}
          onClick={handleNextRows}
        >
          Next
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={{
        background: 'rgba(30,32,34,0.98)',
        borderRadius: 24,
        boxShadow: '0 8px 32px #000b, 0 1.5px 0 #00ffa355',
        padding: 36,
        margin: '40px auto',
        width: '95vw',
        maxWidth: 600,
        border: '1.5px solid #00ffa355',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h2 style={{
          color: '#00ffa3',
          fontWeight: 900,
          fontSize: 32,
          marginBottom: 24,
          letterSpacing: 2,
          textAlign: 'center',
          textShadow: '0 2px 8px #00ffa344'
        }}>Randomizing Teams...</h2>
        <div style={{
          margin: '40px auto',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #00ffa3 40%, #232526 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 80,
          fontWeight: 900,
          color: '#232526',
          boxShadow: '0 0 32px #00ffa366',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated countdown: glowing number with animated ring */}
          <svg width="220" height="220" style={{ position: 'absolute', top: 0, left: 0 }}>
            <circle
              cx="110"
              cy="110"
              r="100"
              stroke="#00ffa3"
              strokeWidth="10"
              fill="none"
              style={{
                opacity: 0.2
              }}
            />
            <circle
              cx="110"
              cy="110"
              r="100"
              stroke="#00ffa3"
              strokeWidth="10"
              fill="none"
              strokeDasharray={2 * Math.PI * 100}
              strokeDashoffset={2 * Math.PI * 100 * (1 - countdown / 5)}
              style={{
                transition: 'stroke-dashoffset 1s linear',
                filter: 'drop-shadow(0 0 16px #00ffa3)'
              }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: 120,
            fontWeight: 900,
            color: '#fff',
            textShadow: '0 0 32px #00ffa3, 0 0 8px #00ffa3, 0 2px 0 #232526',
            animation: 'pop 0.5s'
          }}>
            {countdown}
          </div>
          <style>
            {`
              @keyframes pop {
                0% { transform: scale(1.2) translate(-50%, -50%);}
                100% { transform: scale(1) translate(-50%, -50%);}
              }
            `}
          </style>
        </div>
        <div style={{ color: '#aaa', fontSize: 18, marginTop: 16 }}>Get ready for the teams!</div>
      </div>
    );
  }

  if (step === 3) {
    const sum = arr => arr.reduce((a, b) => a + (parseInt(b.assignedScore) >= 1 ? parseInt(b.assignedScore) : 0), 0);

    return (
      <div style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #232526 100%)',
        borderRadius: 32,
        boxShadow: '0 12px 48px #000d, 0 2px 0 #00ffa355',
        padding: 48,
        margin: '40px auto',
        width: '98vw',
        maxWidth: 1200,
        border: '2px solid #00ffa355',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h2 style={{
          color: '#00ffa3',
          fontWeight: 900,
          fontSize: 40,
          marginBottom: 32,
          letterSpacing: 3,
          textAlign: 'center',
          textShadow: '0 4px 24px #00ffa366, 0 1px 0 #222'
        }}>
          <span style={{
            background: 'linear-gradient(90deg, #00ffa3 0%, #005bea 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Team 1</span>
          <span style={{
            color: '#fff',
            fontWeight: 400,
            margin: '0 32px'
          }}>VS</span>
          <span style={{
            background: 'linear-gradient(90deg, #005bea 0%, #00ffa3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Team 2</span>
        </h2>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: 80,
          width: '100%',
          flexWrap: 'wrap'
        }}>
          {[{ team: teams.team1, name: 'Team 1', color: '#00ffa3' }, { team: teams.team2, name: 'Team 2', color: '#005bea' }].map((t, idx) => (
            <div key={t.name} style={{
              background: 'rgba(24,25,26,0.98)',
              borderRadius: 20,
              boxShadow: `0 4px 24px ${t.color}44`,
              padding: 32,
              minWidth: 320,
              maxWidth: 400,
              flex: 1,
              border: `2px solid ${t.color}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <h3 style={{
                color: t.color,
                fontWeight: 900,
                fontSize: 28,
                marginBottom: 18,
                letterSpacing: 2,
                textShadow: `0 2px 8px ${t.color}66`
              }}>{t.name}</h3>
              <table style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                marginBottom: 12
              }}>
                <thead>
                  <tr style={{
                    color: t.color,
                    fontWeight: 900,
                    fontSize: 18,
                    letterSpacing: 1
                  }}>
                    <th style={{ textAlign: 'center', padding: 12 }}>Name</th>
                    <th style={{ textAlign: 'center', padding: 12 }}>Role</th>
                    <th style={{ textAlign: 'center', padding: 12 }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {t.team.map(p => (
                    <tr key={p.id}>
                      <td style={{ textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 17, padding: 8 }}>{p.name}</td>
                      <td style={{ textAlign: 'center', color: '#00ffa3', fontWeight: 700, fontSize: 17, padding: 8 }}>{p.assignedRole ? p.assignedRole.toUpperCase() : ''}</td>
                      <td style={{ textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 17, padding: 8 }}>{p.assignedScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{
                marginTop: 16,
                color: t.color,
                fontWeight: 900,
                fontSize: 22,
                letterSpacing: 1
              }}>
                Total: {sum(t.team)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40 }}>
          <button
            onClick={() => handlePickWinner('team1')}
            style={{
              background: 'linear-gradient(90deg, #00ffa3 0%, #00d8ff 100%)',
              color: '#222',
              border: 'none',
              borderRadius: 14,
              padding: '16px 48px',
              fontWeight: 900,
              fontSize: 22,
              marginRight: 32,
              boxShadow: '0 2px 8px #00ffa344',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s'
            }}
          >
            🏆 Team 1 Wins
          </button>
          <button
            onClick={() => handlePickWinner('team2')}
            style={{
              background: 'linear-gradient(90deg, #005bea 0%, #00ffa3 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '16px 48px',
              fontWeight: 900,
              fontSize: 22,
              boxShadow: '0 2px 8px #00ffa344',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s'
            }}
          >
            🏆 Team 2 Wins
          </button>
        </div>
      </div>
    );
  }

  if (step === 4) {
    const winnerPlayers = winner ? teams[winner] : [];
    const loserTeam = winner === 'team1' ? 'team2' : 'team1';
    const loserPlayers = loserTeam ? teams[loserTeam] : [];
    return (
      <div style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #232526 100%)',
        borderRadius: 32,
        boxShadow: '0 12px 48px #000d, 0 2px 0 #00ffa355',
        padding: 48,
        margin: '40px auto',
        width: '98vw',
        maxWidth: 800,
        border: '2px solid #00ffa355',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h2 style={{
          color: '#00ffa3',
          fontWeight: 900,
          fontSize: 38,
          marginBottom: 32,
          letterSpacing: 3,
          textAlign: 'center',
          textShadow: '0 4px 24px #00ffa366, 0 1px 0 #222'
        }}>
          <span style={{
            background: winner === 'team1'
              ? 'linear-gradient(90deg, #00ffa3 0%, #005bea 100%)'
              : 'linear-gradient(90deg, #005bea 0%, #00ffa3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {winner === 'team1' ? 'Team 1' : 'Team 2'} Victory!
          </span>
        </h2>
        {/* Winner Table */}
        <div style={{
          background: 'rgba(24,25,26,0.98)',
          borderRadius: 20,
          boxShadow: '0 4px 24px #00ffa344',
          padding: 32,
          margin: '0 auto',
          maxWidth: 600,
          width: '100%',
          border: '2px solid #00ffa355',
          marginBottom: 24
        }}>
          <h3 style={{
            color: '#00ffa3',
            fontWeight: 900,
            fontSize: 24,
            marginBottom: 12,
            letterSpacing: 1,
            textAlign: 'center'
          }}>Winning Team (+1)</h3>
          <table style={{
            width: '100%',
            color: '#fff',
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: 18,
            background: 'transparent'
          }}>
            <thead>
              <tr style={{
                color: '#00ffa3',
                fontWeight: 900,
                fontSize: 19,
                letterSpacing: 1,
                background: '#18191a'
              }}>
                <th style={{ textAlign: 'center', padding: 12 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 12 }}>Role</th>
                <th style={{ textAlign: 'center', padding: 12 }}>Score <span style={{ color: '#00ffa3' }}>↑</span></th>
                <th style={{ textAlign: 'center', padding: 12 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {winnerPlayers.map((p, idx) => (
                <tr key={p.id}
                  style={{
                    background: idx % 2 === 0 ? '#232526' : '#2c2f33',
                    borderBottom: '2px solid #00ffa355'
                  }}>
                  <td style={{
                    textAlign: 'center',
                    color: '#00ffa3',
                    fontWeight: 800,
                    fontSize: 18,
                    letterSpacing: 1,
                    padding: 12
                  }}>{p.name}</td>
                  <td style={{
                    textAlign: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 17,
                    padding: 12
                  }}>{p.assignedRole ? p.assignedRole.toUpperCase() : ''}</td>
                  <td style={{
                    textAlign: 'center',
                    color: '#00ffa3',
                    fontWeight: 900,
                    fontSize: 18,
                    padding: 12
                  }}>
                    {p.assignedScore} <span style={{ color: '#00ffa3', fontWeight: 900, fontSize: 20 }}>↑</span>
                  </td>
                  <td style={{
                    textAlign: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 17,
                    padding: 12
                  }}>
                    <span style={{
                      display: 'inline-block',
                      background: 'linear-gradient(90deg, #00ffa3 0%, #005bea 100%)',
                      color: '#222',
                      borderRadius: 8,
                      padding: '4px 18px',
                      fontWeight: 900,
                      fontSize: 16,
                      letterSpacing: 1
                    }}>+1 {p.assignedRole ? p.assignedRole.toUpperCase() : ''}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Loser Table */}
        <div style={{
          background: 'rgba(40,10,10,0.98)',
          borderRadius: 20,
          boxShadow: '0 4px 24px #ff4b4b44',
          padding: 32,
          margin: '0 auto',
          maxWidth: 600,
          width: '100%',
          border: '2px solid #ff4b4b',
          marginBottom: 24
        }}>
          <h3 style={{
            color: '#ff4b4b',
            fontWeight: 900,
            fontSize: 24,
            marginBottom: 12,
            letterSpacing: 1,
            textAlign: 'center'
          }}>Losing Team (-1)</h3>
          <table style={{
            width: '100%',
            color: '#fff',
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: 18,
            background: 'transparent'
          }}>
            <thead>
              <tr style={{
                color: '#ff4b4b',
                fontWeight: 900,
                fontSize: 19,
                letterSpacing: 1,
                background: '#18191a'
              }}>
                <th style={{ textAlign: 'center', padding: 12 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 12 }}>Role</th>
                <th style={{ textAlign: 'center', padding: 12 }}>Score <span style={{ color: '#ff4b4b' }}>↓</span></th>
                <th style={{ textAlign: 'center', padding: 12 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loserPlayers.map((p, idx) => (
                <tr key={p.id}
                  style={{
                    background: idx % 2 === 0 ? '#2c181a' : '#3a2326',
                    borderBottom: '2px solid #ff4b4b55'
                  }}>
                  <td style={{
                    textAlign: 'center',
                    color: '#ff4b4b',
                    fontWeight: 800,
                    fontSize: 18,
                    letterSpacing: 1,
                    padding: 12
                  }}>{p.name}</td>
                  <td style={{
                    textAlign: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 17,
                    padding: 12
                  }}>{p.assignedRole ? p.assignedRole.toUpperCase() : ''}</td>
                  <td style={{
                    textAlign: 'center',
                    color: '#ff4b4b',
                    fontWeight: 900,
                    fontSize: 18,
                    padding: 12
                  }}>
                    {p.assignedScore} <span style={{ color: '#ff4b4b', fontWeight: 900, fontSize: 20 }}>↓</span>
                  </td>
                  <td style={{
                    textAlign: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 17,
                    padding: 12
                  }}>
                    <span style={{
                      display: 'inline-block',
                      background: 'linear-gradient(90deg, #ff4b4b 0%, #232526 100%)',
                      color: '#fff',
                      borderRadius: 8,
                      padding: '4px 18px',
                      fontWeight: 900,
                      fontSize: 16,
                      letterSpacing: 1
                    }}>-1 {p.assignedRole ? p.assignedRole.toUpperCase() : ''}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={handleNextMatch}
          style={{
            marginTop: 24,
            background: 'linear-gradient(90deg, #00ffa3 0%, #00d8ff 100%)',
            color: '#222',
            border: 'none',
            borderRadius: 14,
            padding: '16px 48px',
            fontWeight: 900,
            fontSize: 22,
            boxShadow: '0 2px 8px #00ffa344',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s'
          }}
        >
          Next Match
        </button>
      </div>
    );
  }

  return null;
}

export default Randomizer;
