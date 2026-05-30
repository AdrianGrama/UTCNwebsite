import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const getRememberedUsername = () => {
    try {
        return localStorage.getItem('remembered_username') || '';
    } catch {
        return '';
    }
};

const Login = () => {
    const [username, setUsername] = useState(() => getRememberedUsername());
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(() => Boolean(getRememberedUsername()));
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, user, theme } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const cleanUsername = username.trim();
        const cleanPassword = password.trim();

        if (!cleanUsername && !cleanPassword) {
            setError('Completează utilizatorul și parola.');
            return;
        }

        if (!cleanUsername) {
            setError('Completează utilizatorul.');
            return;
        }

        if (!cleanPassword) {
            setError('Completează parola.');
            return;
        }

        if (cleanUsername.length < 3) {
            setError('Utilizatorul trebuie să aibă cel puțin 3 caractere.');
            return;
        }

        if (cleanPassword.length < 3) {
            setError('Parola trebuie să aibă cel puțin 3 caractere.');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            await login(cleanUsername, cleanPassword);

            if (rememberMe) {
                localStorage.setItem('remembered_username', cleanUsername);
            } else {
                localStorage.removeItem('remembered_username');
            }

            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message || 'Credentiale invalide. Încearcă din nou.');
        } finally {
            setIsSubmitting(false);
        }
    };
    const isFormInvalid = !username.trim() || !password.trim();

    return (
        <main className="modern-login-page">
            <section className="modern-login-shell">
                <aside className="modern-login-hero">
                    <div className="modern-login-badge">UTCN • AC Portal</div>

                    <div className="modern-login-hero-content">
                        <h1>Facultatea de Automatică și Calculatoare</h1>
                        <p>
                            Acces rapid la situația școlară, anunțuri academice și informații
                            relevante pentru studenți și cadre didactice.
                        </p>
                    </div>

                    <div className="modern-login-features">
                        <article>
                            <span>01</span>
                            <strong>Situație școlară</strong>
                            <small>Note, medii, credite și evidență academică.</small>
                        </article>

                        <article>
                            <span>02</span>
                            <strong>Anunțuri</strong>
                            <small>Comunicări importante din partea facultății.</small>
                        </article>

                        <article>
                            <span>03</span>
                            <strong>Dashboard</strong>
                            <small>Informații centralizate într-o interfață clară.</small>
                        </article>
                    </div>
                </aside>

                <div className="modern-login-card-wrapper">
                    <form className="modern-login-card" onSubmit={handleSubmit}>
                        <div className="modern-login-card-header">
                            <img 
                                src={theme === 'dark' 
                                  ? 'https://res.cloudinary.com/donhemyhq/image/upload/v1780085546/logo4_xvuart.png' 
                                  : 'https://res.cloudinary.com/donhemyhq/image/upload/v1780085330/logo3_wraojl.png'
                                } 
                                alt="UTCN Logo" 
                                className="modern-login-logo" 
                                style={{ objectFit: 'contain', padding: '2px', background: 'transparent', boxShadow: 'none' }}
                            />

                            <div>
                                <h2>Autentificare</h2>
                                <p>Intră în portalul studențesc UTCN.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="modern-login-error" role="alert" aria-live="polite">
                                <span className="modern-login-field-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                        />
                                        <path
                                            d="M4.5 20C5.4 16.9 8.2 15 12 15C15.8 15 18.6 16.9 19.5 20"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="modern-login-form-group">
                            <label htmlFor="username">Utilizator sau email</label>

                            <div className="modern-login-input-box">
                                <span aria-hidden="true" />
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(event) => {
                                        setUsername(event.target.value);
                                        setError('');
                                    }}
                                    placeholder="ex: popescu.ion"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="modern-login-form-group">
                            <label htmlFor="password">Parolă</label>

                            <div className="modern-login-input-box">
                                <span className="modern-login-field-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M7 11V8C7 5.2 9 3.5 12 3.5C15 3.5 17 5.2 17 8V11"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M6.5 11H17.5C18.6046 11 19.5 11.8954 19.5 13V19C19.5 20.1046 18.6046 21 17.5 21H6.5C5.39543 21 4.5 20.1046 4.5 19V13C4.5 11.8954 5.39543 11 6.5 11Z"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                        />
                                    </svg>
                                </span>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        setError('');
                                    }}
                                    placeholder="Introdu parola"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                        </div>

                        <div className="modern-login-options">
                            <label className="modern-login-checkbox" htmlFor="rememberMe">
                                <input
                                    id="rememberMe"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(event) => setRememberMe(event.target.checked)}
                                />
                                <span>Ține-mă minte</span>
                            </label>

                            <span className="modern-login-secure">Conexiune securizată</span>
                        </div>

                        <button
                            className="modern-login-submit"
                            type="submit"
                            disabled={isSubmitting || isFormInvalid}
                        >
                            {isSubmitting ? 'Se autentifică...' : 'Conectare'}
                        </button>

                        <div className="modern-login-demo">
                            <div className="modern-login-demo-header">
                                <p>Acces demo pentru testare</p>
                                <span>Roluri disponibile</span>
                            </div>

                            <div className="modern-login-demo-row">
                                <span>Student</span>
                                <code>popescu.ion</code>
                            </div>

                            <div className="modern-login-demo-row">
                                <span>Profesor</span>
                                <code>dobra.fecior</code>
                            </div>

                            <small>
                                Conturile demo sunt folosite doar pentru testarea locală a aplicației.
                            </small>
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
};

export default Login;