
import { useState } from 'react';

import '../styles/contact.css';
import '../styles/contact-artwork.css';

/* ========================================
   CONTACT INFORMATION
   ======================================== */

const CONTACT_EMAIL = 'ilyaashussein123@gmail.com';
const CONTACT_PHONE = '+1 613 265 6722';

const INITIAL_FIELDS = {
  email: '',
  name: '',
  message: '',
  company: '',
};

/* ========================================
   BACKGROUND ARTWORK

   Reuses the exact same logo.svg
   and filter approach as the Home page.
   ======================================== */

function ContactArtwork() {
  return (
    <>
      <svg
        className="contact-artwork-filter"
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            id="ih-contact-outline"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
            colorInterpolationFilters="sRGB"
          >
            {/* Create the outer outline */}

            <feMorphology
              in="SourceAlpha"
              operator="dilate"
              radius="1"
              result="expanded"
            />

            <feComposite
              in="expanded"
              in2="SourceAlpha"
              operator="out"
              result="outline-mask"
            />

            {/* Yellow outline: 30% opacity */}

            <feFlood
              floodColor="#FDFF01"
              floodOpacity="0.3"
              result="outline-colour"
            />

            <feComposite
              in="outline-colour"
              in2="outline-mask"
              operator="in"
              result="yellow-outline"
            />

            {/* Black fill: 50% opacity */}

            <feFlood
              floodColor="#000000"
              floodOpacity="0.5"
              result="fill-colour"
            />

            <feComposite
              in="fill-colour"
              in2="SourceAlpha"
              operator="in"
              result="black-fill"
            />

            <feMerge>
              <feMergeNode in="yellow-outline" />
              <feMergeNode in="black-fill" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <img
        className="contact-artwork-image"
        src="/icons/logo.svg"
        alt=""
        aria-hidden="true"
        draggable="false"
      />
    </>
  );
}

/* ========================================
   CONTACT DETAILS
   ======================================== */

function ContactDetails() {
  return (
    <>
      <header className="contact-page__lead">
        <p className="contact-page__eyebrow">
          {'{GOT A PROJECT IN MIND?}'}
        </p>

        <h1 className="contact-page__title">
          JUST MAKE
          <span>IT AWESOME</span>
        </h1>
      </header>

      <div className="contact-page__details">
        <div className="contact-page__detail">
          <span className="contact-page__detail-label">
            E.
          </span>

          <a href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </div>

        <div className="contact-page__detail">
          <span className="contact-page__detail-label">
            P.
          </span>

          <a href="tel:+16132666722">
            {CONTACT_PHONE}
          </a>
        </div>
      </div>
    </>
  );
}

/* ========================================
   FORM VALIDATION
   ======================================== */

function validate(fields) {
  const errors = {};

  const email = fields.email.trim();
  const name = fields.name.trim();
  const message = fields.message.trim();

  if (!email) {
    errors.email =
      'Please enter your email address.';
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.email =
      'Please enter a valid email address.';
  }

  if (!name) {
    errors.name = 'Please enter your name.';
  }

  if (!message) {
    errors.message = 'Please enter a message.';
  }

  return errors;
}

/* ========================================
   CONTACT FORM
   ======================================== */

function ContactForm() {
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const sending = status === 'sending';

  function updateField(event) {
    const { name, value } = event.target;

    setFields((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));

    if (status !== 'sending') {
      setStatus('idle');
      setStatusMessage('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (sending) return;

    /* Honeypot */

    if (fields.company) return;

    const nextErrors = validate(fields);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus('error');
      setStatusMessage(
        'Please check the fields above.'
      );
      return;
    }

    if (import.meta.env.DEV) {
      setStatus('idle');
      setStatusMessage(
        'Form preview only. Deploy to Netlify to send messages.'
      );
      return;
    }

    setStatus('sending');
    setStatusMessage('');

    try {
      const body = new URLSearchParams({
        'form-name': 'portfolio-contact',
        email: fields.email.trim(),
        name: fields.name.trim(),
        message: fields.message.trim(),
        company: '',
      });

      const response = await fetch('/', {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error(
          `Contact form returned ${response.status}`
        );
      }

      setStatus('sent');
      setStatusMessage(
        'Message sent. Thanks for reaching out!'
      );

      setFields(INITIAL_FIELDS);
      setErrors({});
    } catch (error) {
      console.error(
        '[Contact] Submission failed:',
        error
      );

      setStatus('error');
      setStatusMessage(
        'Something went wrong. Please email me directly.'
      );
    }
  }

  return (
    <div className="contact-page__form-column">
      <form
        className="contact-form"
        name="portfolio-contact"
        method="POST"
        action="/"
        noValidate
        onSubmit={handleSubmit}
      >
        <input
          type="hidden"
          name="form-name"
          value="portfolio-contact"
        />

        {/* EMAIL */}

        <div className="contact-form__field">
          <label
            className="contact-form__label"
            htmlFor="contact-email"
          >
            E-Mail*
          </label>

          <input
            className="contact-form__control"
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={fields.email}
            onChange={updateField}
            required
            disabled={sending}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email
                ? 'contact-email-error'
                : undefined
            }
          />

          {errors.email && (
            <span
              className="contact-form__error"
              id="contact-email-error"
            >
              {errors.email}
            </span>
          )}
        </div>

        {/* NAME */}

        <div className="contact-form__field">
          <label
            className="contact-form__label"
            htmlFor="contact-name"
          >
            Name*
          </label>

          <input
            className="contact-form__control"
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={200}
            value={fields.name}
            onChange={updateField}
            required
            disabled={sending}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={
              errors.name
                ? 'contact-name-error'
                : undefined
            }
          />

          {errors.name && (
            <span
              className="contact-form__error"
              id="contact-name-error"
            >
              {errors.name}
            </span>
          )}
        </div>

        {/* MESSAGE */}

        <div className="contact-form__field">
          <label
            className="contact-form__label"
            htmlFor="contact-message"
          >
            Message*
          </label>

          <textarea
            className="contact-form__control contact-form__control--area"
            id="contact-message"
            name="message"
            rows={5}
            maxLength={5000}
            value={fields.message}
            onChange={updateField}
            required
            disabled={sending}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={
              errors.message
                ? 'contact-message-error'
                : undefined
            }
          />

          {errors.message && (
            <span
              className="contact-form__error"
              id="contact-message-error"
            >
              {errors.message}
            </span>
          )}
        </div>

        {/* SPAM HONEYPOT */}

        <div
          className="contact-form__trap"
          aria-hidden="true"
        >
          <label htmlFor="contact-company">
            Company
          </label>

          <input
            id="contact-company"
            name="company"
            type="text"
            value={fields.company}
            onChange={updateField}
            autoComplete="off"
            tabIndex={-1}
          />
        </div>

        {/* SEND BUTTON */}

        <div className="contact-form__footer">
          <p
            className={`contact-form__status contact-form__status--${status}`}
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </p>

          <button
            className="contact-form__submit"
            type="submit"
            disabled={sending}
          >
            <span>
              {sending ? 'Sending...' : 'Send'}
            </span>

            <svg
              className="contact-form__arrow"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 19L19 5M8 5H19V16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

/* ========================================
   CONTACT PAGE
   ======================================== */

function Contact() {
  return (
    <main className="contact-page">
      <ContactArtwork />

      <div className="contact-page__inner">
        <ContactDetails />
        <ContactForm />
      </div>
    </main>
  );
}

export default Contact;
