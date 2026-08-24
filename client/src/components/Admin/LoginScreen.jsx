import React, { useState } from 'react';
import { ShieldCheck, UserCheck, KeyRound, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../../utils/api';
import './LoginScreen.css';

export default function LoginScreen({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [brandName, setBrandName] = useState('');
  const [role, setRole] = useState('seller');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [liquidActive, setLiquidActive] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.post('/api/auth/register', {
          username,
          password,
          email,
          role,
          brand_name: role === 'seller' ? brandName : null,
        });

        localStorage.setItem('shopverse_token', res.data.token);
        triggerLiquidTransition(res.data.user);
      } else {
        const res = await api.post('/api/auth/login', {
          username,
          password,
        });

        localStorage.setItem('shopverse_token', res.data.token);
        triggerLiquidTransition(res.data.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      setLoading(false);
    }
  };

  const triggerLiquidTransition = (user) => {
    setLiquidActive(true);
    setTimeout(() => {
      onLoginSuccess(user);
    }, 1200);
  };

  return (
    <div className="shopverse-auth-page">
      {/* Liquid Organic Transition Overlay */}
      {liquidActive && (
        <div className="shopverse-liquid-overlay">
          <svg className="shopverse-liquid-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <path
              className="shopverse-blob shopverse-blob--1"
              d="M0,0 C150,90 350,-40 500,100 C650,240 900,100 1000,0 L1000,1000 L0,1000 Z"
            />
            <path
              className="shopverse-blob shopverse-blob--2"
              d="M0,0 C200,120 400,-20 600,80 C800,180 950,50 1000,0 L1000,1000 L0,1000 Z"
            />
          </svg>
        </div>
      )}

      <div className="shopverse-auth-card">
        <div className="shopverse-auth-card__header">
          <span className="shopverse-auth-card__brand">Shopverse</span>
          <h1 className="shopverse-auth-card__title">
            {isRegister ? 'Create Seller Brand' : 'Merchant & Admin Portal'}
          </h1>
          <p className="shopverse-auth-card__subtitle">
            {isRegister
              ? 'Join our curated guild of designers and artisanal manufacturers'
              : 'Enter your credentials to access inventory and campaigns'}
          </p>
        </div>

        {error && (
          <div className="shopverse-auth-card__error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="shopverse-auth-form">
          <label className="shopverse-auth-field">
            <span>Username</span>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. urban_seller"
            />
          </label>

          {isRegister && (
            <>
              <label className="shopverse-auth-field">
                <span>Email Address</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="contact@brand.com"
                />
              </label>

              <label className="shopverse-auth-field">
                <span>Brand Name *</span>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="e.g. Atelier Noir"
                />
              </label>
            </>
          )}

          <label className="shopverse-auth-field">
            <span>Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>




          <button
            type="submit"
            className="shopverse-auth-submit"
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'Register Brand' : 'Enter Portal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="shopverse-auth-card__footer">
          <button
            type="button"
            className="shopverse-auth-toggle"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
          >
            {isRegister
              ? 'Already registered? Sign into portal'
              : "Need a merchant account? Register your brand"}
          </button>
        </div>
      </div>
    </div>
  );
}
