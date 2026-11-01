import React from 'react';
interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}
const officialLinks = [
  [
    'MUET Official Website',
    'University news, departments and announcements',
    'https://muet.edu.pk/',
  ],
  [
    'MUET Student Portal',
    'Student services and academic information',
    'https://student.muet.edu.pk/',
  ],
  [
    'MUET LMS',
    'Learning management and course resources',
    'https://lms.muet.edu.pk/',
  ],
  [
    'MUET Admissions',
    'Admissions information and application guidance',
    'https://admissions.muet.edu.pk/',
  ],
  [
    'MUET Library',
    'Library catalogue and digital resources',
    'https://library.muet.edu.pk/',
  ],
];
export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  return (
    <div className="landing-page">
      {' '}
      <header className="landing-nav">
        <a className="landing-brand" href="#top">
          <span className="brand-logo">T</span>
          <span>
            <strong>TRACE</strong>
            <small>MUET Campus Lost & Found</small>
          </span>
        </a>
        <nav className="landing-links">
          <a href="#about">About</a>
          <a href="#how-it-works">How it works</a>
          <a href="#official-links">MUET links</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="landing-actions">
          <button className="btn btn-ghost" onClick={onLogin}>
            Log in
          </button>
          <button className="btn btn-primary" onClick={onRegister}>
            Create account
          </button>
        </div>
      </header>{' '}
      <main id="top">
        {' '}
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="landing-eyebrow">
              <span /> MUET VERIFIED COMMUNITY
            </div>
            <h1>
              Lost something?
              <br />
              <em>Let campus help.</em>
            </h1>
            <p>
              TRACE helps Mehran University students report lost belongings,
              return found items, and arrange a safe handover without sharing
              private contact details.
            </p>
            <div className="landing-hero-actions">
              <button className="btn btn-primary btn-lg" onClick={onRegister}>
                Get started free <span>→</span>
              </button>
              <button className="btn btn-secondary btn-lg" onClick={onLogin}>
                I already have an account
              </button>
            </div>
            <div className="landing-trust-row">
              <span>✓ University email only</span>
              <span>✓ Verified ownership</span>
              <span>✓ Safe campus points</span>
            </div>
          </div>
          <div className="landing-hero-art">
            <div className="landing-orbit orbit-one" />
            <div className="landing-orbit orbit-two" />
            <div className="landing-item-card landing-item-main">
              <div className="landing-item-icon">�</div>
              <div>
                <small>FOUND ITEM</small>
                <strong>Wireless earbuds</strong>
                <span>� Main Library · 2h ago</span>
              </div>
              <b>✓</b>
            </div>
            <div className="landing-item-card landing-item-float">
              <div className="landing-avatar">A</div>
              <div>
                <small>SAFE MATCH</small>
                <strong>Possible owner found</strong>
                <span>Ownership verification ready</span>
              </div>
            </div>
            <div className="landing-signal">
              <span>TRACE</span>
              <strong>Return with confidence.</strong>
            </div>
          </div>
        </section>{' '}
        <section className="landing-stats">
          <div>
            <strong>01</strong>
            <span>Report in seconds</span>
            <p>Clear posting tools for lost and found items.</p>
          </div>
          <div>
            <strong>02</strong>
            <span>Verify before contact</span>
            <p>Private answers help prevent false claims.</p>
          </div>
          <div>
            <strong>03</strong>
            <span>Meet safely</span>
            <p>Use trusted points around campus.</p>
          </div>
        </section>{' '}
        <section className="landing-section landing-split" id="about">
          <div>
            <div className="landing-eyebrow">ABOUT TRACE</div>
            <h2>A calmer way to get belongings home.</h2>
          </div>
          <p>
            TRACE is a university-only lost-and-found network built for MUET.
            Discovery stays public, ownership details stay private, and
            conversations stay in a safer campus space.
          </p>
        </section>{' '}
        <section className="landing-section" id="how-it-works">
          <div className="landing-section-heading">
            <div>
              <div className="landing-eyebrow">HOW IT WORKS</div>
              <h2>Three small steps. One good outcome.</h2>
            </div>
            <p>Designed for the moment you realise something is missing.</p>
          </div>
          <div className="landing-steps">
            <article>
              <b>01</b>
              <span>Post</span>
              <p>Add a photo, description and campus location.</p>
            </article>
            <article>
              <b>02</b>
              <span>Verify</span>
              <p>Answer private questions before any handover.</p>
            </article>
            <article>
              <b>03</b>
              <span>Return</span>
              <p>Coordinate at a safe point and close the loop.</p>
            </article>
          </div>
        </section>{' '}
        <section className="landing-section" id="official-links">
          <div className="landing-section-heading">
            <div>
              <div className="landing-eyebrow">MUET RESOURCES</div>
              <h2>Official university links</h2>
            </div>
            <p>Quick access to services students use most.</p>
          </div>
          <div className="official-links-grid">
            {officialLinks.map(([name, detail, url]) => (
              <a
                className="official-link"
                key={name}
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="official-link-icon">↗</span>
                <span>
                  <strong>{name}</strong>
                  <small>{detail}</small>
                </span>
                <b>→</b>
              </a>
            ))}
          </div>
        </section>{' '}
        <section className="landing-contact" id="contact">
          <div>
            <div className="landing-eyebrow">NEED HELP?</div>
            <h2>We are here when campus gets complicated.</h2>
          </div>
          <div>
            <p>
              For account or safety support, contact the TRACE team through your
              MUET support channel.
            </p>
            <a
              href="mailto:support@trace.muet.edu.pk"
              className="btn btn-secondary"
            >
              Email TRACE support
            </a>
          </div>
        </section>{' '}
      </main>
      <footer className="landing-footer">
        <span>
          © 2026 TRACE · Mehran University of Engineering & Technology
        </span>
        <span>Built for a safer, kinder campus.</span>
      </footer>{' '}
    </div>
  );
}
