import React, { useEffect, useState } from 'react';

const defaultRoles = { overall: 5, top: 0, jungle: 0, mid: 0, adc: 0, sup: 0 };
const INITIATE_PASSWORD = "letmein"; // TODO: change this to your real password

function InitiatePlayer() {
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ name: '', ...defaultRoles });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [passed, setPassed] = useState(false);

  // Fetch players from backend
  useEffect(() => {
    fetch('/api/players').then(res => res.json()).then(data => {
      setPlayers(data.filter(p => p.name && p.name.toLowerCase() !== 'name'));
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (['overall', 'top', 'jungle', 'mid', 'adc', 'sup'].includes(name)) {
      // Only allow numbers between 0 and 100
      let num = parseInt(v);
      if (isNaN(num)) num = 0;
      if (num > 100) num = 100;
      if (num < 0) num = 0;
      v = num;
    }
    setForm({ ...form, [name]: v });
  };

  const handleRoleChange = (role, delta) => {
    setForm(f => {
      let next = (parseInt(f[role]) || 0) + delta;
      if (next > 100) next = 100;
      if (next < 0) next = 0;
      return { ...f, [role]: next };
    });
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    for (const key of ['overall', 'top', 'jungle', 'mid', 'adc', 'sup']) {
      const val = parseInt(form[key]);
      if (isNaN(val) || val < 0 || val > 100) {
        return `Each score must be between 0 and 100`;
      }
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setError('');
    const payload = {
      name: form.name.trim(),
      overall: parseInt(form.overall) || 0,
      top: parseInt(form.top) || 0,
      jungle: parseInt(form.jungle) || 0,
      mid: parseInt(form.mid) || 0,
      adc: parseInt(form.adc) || 0,
      sup: parseInt(form.sup) || 0,
    };
    if (editingId) {
      await fetch(`/api/players/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    setForm({ name: '', ...defaultRoles });
    setEditingId(null);
    fetch('/api/players').then(res => res.json()).then(data => {
      setPlayers(data.filter(p => p.name && p.name.toLowerCase() !== 'name'));
    });
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, overall: p.overall, top: p.top, jungle: p.jungle, mid: p.mid, adc: p.adc, sup: p.sup });
    setEditingId(p.id);
  };

  const handleRemove = async (id) => {
    await fetch(`/api/players/${id}`, { method: 'DELETE' });
    fetch('/api/players').then(res => res.json()).then(data => {
      setPlayers(data.filter(p => p.name && p.name.toLowerCase() !== 'name'));
    });
  };

  const handleCancel = () => {
    setForm({ name: '', ...defaultRoles });
    setEditingId(null);
    setError('');
  };

  // Password gate UI
  if (!passed) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #18191a 0%, #232526 100%)'
      }}>
        <div style={{
          background: 'rgba(30,32,34,0.98)',
          borderRadius: 18,
          boxShadow: '0 8px 32px #000b, 0 1.5px 0 #00ffa355',
          padding: 40,
          border: '1.5px solid #00ffa355',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <h2 style={{
            color: '#00ffa3',
            fontWeight: 900,
            fontSize: 28,
            marginBottom: 24,
            letterSpacing: 2,
            textAlign: 'center'
          }}>Enter Password</h2>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              border: '2px solid #00ffa3',
              width: 220,
              fontSize: 19,
              background: '#18191a',
              color: '#fff',
              fontWeight: 700,
              outline: 'none',
              boxShadow: '0 2px 12px #00ffa344',
              marginBottom: 18,
              transition: 'border 0.2s'
            }}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && password === INITIATE_PASSWORD) setPassed(true);
            }}
          />
          <button
            onClick={() => {
              if (password === INITIATE_PASSWORD) setPassed(true);
            }}
            style={{
              background: password === INITIATE_PASSWORD ? 'linear-gradient(90deg, #00ffa3 0%, #00d8ff 100%)' : '#444',
              color: password === INITIATE_PASSWORD ? '#222' : '#888',
              border: 'none',
              borderRadius: 12,
              padding: '12px 36px',
              fontWeight: 900,
              fontSize: 20,
              cursor: password === INITIATE_PASSWORD ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s, color 0.2s'
            }}
            disabled={password !== INITIATE_PASSWORD}
          >
            Enter
          </button>
          {password && password !== INITIATE_PASSWORD && (
            <div style={{ color: '#ff4b4b', marginTop: 12, fontWeight: 700 }}>Incorrect password</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif',
      margin: '0 auto',
      maxWidth: 1200,
      padding: '32px 0',
      background: 'linear-gradient(135deg, #18191a 0%, #232526 100%)',
      minHeight: '100vh'
    }}>
      <h2 style={{
        color: '#00ffa3',
        marginBottom: 32,
        fontWeight: 900,
        fontSize: 38,
        letterSpacing: 2,
        textAlign: 'center',
        textShadow: '0 4px 24px #00ffa366, 0 1px 0 #222'
      }}>
        Initiate Player
      </h2>
      <div
        style={{
          background: 'rgba(30,32,34,0.98)',
          borderRadius: 24,
          boxShadow: '0 8px 32px #000b, 0 1.5px 0 #00ffa355',
          padding: 36,
          marginBottom: 48,
          width: '95vw',
          maxWidth: 700,
          marginLeft: 'auto',
          marginRight: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: '1.5px solid #00ffa355',
          backdropFilter: 'blur(2px)'
        }}
      >
        <form onSubmit={handleSubmit} style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            width: '100%',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <label style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: 1, marginRight: 4 }}>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              style={{
                padding: '12px 18px',
                borderRadius: 12,
                border: '2px solid #00ffa3',
                width: 210,
                fontSize: 19,
                background: '#18191a',
                color: '#fff',
                fontWeight: 700,
                outline: 'none',
                boxShadow: '0 2px 12px #00ffa344',
                transition: 'border 0.2s'
              }}
              autoFocus
              maxLength={20}
              placeholder="Enter player name"
            />
            <button type="submit" style={{
              background: 'linear-gradient(90deg, #00ffa3 0%, #00d8ff 100%)',
              color: '#222',
              border: 'none',
              borderRadius: 12,
              padding: '12px 36px',
              fontWeight: 900,
              fontSize: 20,
              marginLeft: 28,
              boxShadow: '0 2px 12px #00ffa344',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s'
            }}>{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button type="button" onClick={handleCancel} style={{
              background: '#222',
              color: '#fff',
              border: '2px solid #00ffa3',
              borderRadius: 12,
              padding: '12px 28px',
              fontWeight: 800,
              fontSize: 20,
              marginLeft: 10,
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s'
            }}>Cancel</button>}
          </div>
          <div style={{
            display: 'flex',
            gap: 40,
            justifyContent: 'center',
            width: '100%',
            flexWrap: 'nowrap'
          }}>
            {['top', 'jungle', 'mid', 'adc', 'sup'].map((role) => (
              <div
                key={role}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 110
                }}
              >
                <span style={{
                  fontSize: 16,
                  color: '#00ffa3',
                  fontWeight: 800,
                  marginBottom: 6,
                  letterSpacing: 1
                }}>{role.toUpperCase()}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" onClick={() => handleRoleChange(role, -1)} style={{
                    width: 30, height: 30, borderRadius: 15, border: 'none', background: '#222', color: '#00ffa3', fontSize: 20, fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 4px #00ffa344', transition: 'background 0.2s'
                  }}>-</button>
                  <input
                    name={role}
                    value={form[role]}
                    onChange={handleChange}
                    style={{
                      width: 44,
                      textAlign: 'center',
                      border: '2px solid #00ffa3',
                      borderRadius: 8,
                      fontSize: 17,
                      background: '#18191a',
                      color: '#fff',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                  <button type="button" onClick={() => handleRoleChange(role, 1)} style={{
                    width: 30, height: 30, borderRadius: 15, border: 'none', background: '#00ffa3', color: '#222', fontSize: 20, fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 4px #00ffa344', transition: 'background 0.2s'
                  }}>+</button>
                </div>
              </div>
            ))}
          </div>
          {error && <div style={{ color: '#ff4b4b', marginTop: 4, fontWeight: 800, fontSize: 16 }}>{error}</div>}
        </form>
      </div>
      <div
        style={{
          background: 'rgba(30,32,34,0.98)',
          borderRadius: 24,
          boxShadow: '0 8px 32px #000b, 0 1.5px 0 #00ffa355',
          padding: 0,
          overflowX: 'auto',
          width: '98vw',
          maxWidth: 1200,
          marginLeft: 'auto',
          marginRight: 'auto',
          border: '1.5px solid #00ffa355'
        }}
      >
        <table style={{
          width: '100%',
          minWidth: 1100,
          color: '#fff',
          borderCollapse: 'separate',
          borderSpacing: 0,
          fontSize: 17,
          fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif',
          border: 'none'
        }}>
          <thead>
            <tr style={{
              // ...existing style...
            }}>
              <th className="special name"
                style={{
                  padding: '18px 0 18px 18px',
                  textAlign: 'center',
                  borderRight: '2px solid #00ffa355',
                  minWidth: 200,
                  maxWidth: 220,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  background: '#18191a',
                  color: '#00ffa3',
                  fontSize: 19,
                  letterSpacing: 1,
                  fontWeight: 900,
                  boxShadow: '0 2px 8px #00ffa344'
                }}>Name</th>
              {/* <th className="special overall" ...>Overall</th> */}
              <th className="top" style={{ /* ...existing style... */ }}>Top</th>
              <th className="jungle" style={{ /* ...existing style... */ }}>Jungle</th>
              <th className="mid" style={{ /* ...existing style... */ }}>Mid</th>
              <th className="adc" style={{ /* ...existing style... */ }}>ADC</th>
              <th className="sup" style={{ /* ...existing style... */ }}>SUP</th>
              <th className="actions" style={{ /* ...existing style... */ }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: 28, fontSize: 18 }}>No players yet.</td>
              </tr>
            )}
            {players.map((p, idx) => (
              <tr key={p.id}
                style={{
                  // ...existing style...
                }}
                onMouseOver={e => e.currentTarget.style.background = '#00ffa322'}
                onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? '#232526' : '#2c2f33'}
              >
                <td className="special name"
                  style={{
                    // ...existing style...
                  }}>{p.name}</td>
                {/* <td className="special overall" ...>{p.overall}</td> */}
                <td className="top" style={{ /* ...existing style... */ }}>{p.top}</td>
                <td className="jungle" style={{ /* ...existing style... */ }}>{p.jungle}</td>
                <td className="mid" style={{ /* ...existing style... */ }}>{p.mid}</td>
                <td className="adc" style={{ /* ...existing style... */ }}>{p.adc}</td>
                <td className="sup" style={{ /* ...existing style... */ }}>{p.sup}</td>
                <td className="actions" style={{ /* ...existing style... */ }}>
                  <button
                    onClick={() => handleEdit(p)}
                    title="Edit"
                    style={{
                      marginRight: 8,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 24,
                      color: '#00ffa3',
                      verticalAlign: 'middle',
                      display: 'inline-block',
                      lineHeight: 1,
                      padding: 0,
                      transition: 'color 0.2s'
                    }}
                  >
                    <span role="img" aria-label="edit" style={{ fontSize: 24, verticalAlign: 'middle', lineHeight: 1 }}>✏️</span>
                  </button>
                  <button
                    onClick={() => handleRemove(p.id)}
                    title="Remove"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 24,
                      color: '#ff4b4b',
                      verticalAlign: 'middle',
                      display: 'inline-block',
                      lineHeight: 1,
                      padding: 0,
                      transition: 'color 0.2s'
                    }}
                  >
                    <span role="img" aria-label="remove" style={{ fontSize: 24, verticalAlign: 'middle', lineHeight: 1 }}>🗑️</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InitiatePlayer;