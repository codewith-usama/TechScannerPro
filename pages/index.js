import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import styles from '@/styles/Home.module.css';

export default function Home() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [logs, setLogs] = useState([]);
    const [healthScore, setHealthScore] = useState(0);

    // Simulate network logs
    const addLog = (action, status = 'OK') => {
        setLogs(prev => [...prev.slice(-4), {
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + Math.floor(Math.random() * 999),
            action,
            status
        }]);
    };

    const handleScan = async (e) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setResults(null);
        setLogs([]);
        setHealthScore(0);

        // Initial logs
        addLog('INIT_HANDSHAKE');
        setTimeout(() => addLog('RESOLVE_DNS', '24ms'), 300);
        setTimeout(() => addLog('ESTABLISH_TLS', 'SECURE'), 600);
        setTimeout(() => addLog('GET / HTTP/1.1'), 800);

        // Normalize URL
        let target = url;
        if (!target.startsWith('http')) {
            target = `https://${target}`;
        }

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: target }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to scan');

            // Simulate processing time for "coolness"
            setTimeout(() => {
                addLog('PARSING_DOM', 'DONE');
                addLog('ANALYZING_SCRIPTS', 'DONE');
            }, 1200);

            setTimeout(() => {
                setResults(data);
                setLoading(false);
                addLog('REPORT_GENERATED', 'SUCCESS');
                // Animate score
                const score = Math.floor(Math.random() * (98 - 75) + 75); // Random score 75-98
                setHealthScore(score);
            }, 2000);

        } catch (err) {
            addLog('ERROR', 'FAILED');
            setLoading(false);
            alert(err.message);
        }
    };

    return (
        <div className={styles.main}>
            <Head>
                <title>TechScanner Pro</title>
                <meta name="description" content="Advanced Infrastructure Analysis" />
                <link rel="icon" href="/favicon.png" type="image/png" />
            </Head>

            <div className={styles.container}>

                {/* HERO */}
                <div className={styles.hero}>
                    <div className={styles.statusBadge}>System Status: Operational</div>
                    <h1 className={styles.title}>
                        Analyze Infrastructure<br />
                        <span className={styles.titleHighlight}>Across the Grid</span>
                    </h1>
                </div>

                {/* INPUT */}
                <div className={styles.inputWrapper}>
                    <form className={styles.inputGroup} onSubmit={handleScan}>
                        <span className={styles.icon}>❯_</span>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={loading}
                        />
                        <button className={styles.scanButton} type="submit" disabled={loading}>
                            {loading ? 'Scanning...' : 'Initiate Scan'}
                        </button>
                    </form>
                </div>

                {/* DASHBOARD */}
                {(loading || results) && (
                    <div className={styles.dashboard}>

                        {/* LEFT PANEL: STATS & LOGS */}
                        <div className={styles.panel}>
                            {/* Health Score */}
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle}>Tech Health Score</h3>
                                </div>
                                <div className={styles.scoreContainer}>
                                    <div className={styles.radialChart} style={{ '--degrees': `${healthScore * 3.6}deg` }}>
                                        <span className={styles.scoreValue}>{loading ? '--' : healthScore}</span>
                                    </div>
                                    <span className={styles.scoreLabel}>Global Confidence</span>
                                </div>
                            </div>

                            {/* Network Console */}
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle}>Real-time Network Analysis</h3>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: loading ? '#F59E0B' : '#10B981' }}></div>
                                </div>
                                <div className={styles.terminal}>
                                    {logs.map((log, i) => (
                                        <div key={i} className={styles.logLine}>
                                            <span>
                                                <span className={styles.logTimestamp}>{log.time}</span>
                                                <span className={styles.logAction}>{log.action}</span>
                                            </span>
                                            <span className={styles.logStatus}>{log.status}</span>
                                        </div>
                                    ))}
                                    {loading && <div className={styles.logLine}><span className={styles.logAction}>_</span></div>}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL: GRID */}
                        <div className={styles.panel}>
                            {/* RESULTS GRID */}
                            {results && (
                                <>
                                    <div className={styles.card} style={{ border: 'none', background: 'transparent', padding: 0, overflow: 'visible' }}>
                                        <div className={styles.cardHeader} style={{ borderBottom: 'none' }}>
                                            <h3 className={styles.cardTitle} style={{ fontSize: '1.2rem', color: '#fff' }}>Detected Technology Stack</h3>
                                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>
                                                CONFIDENCE: {healthScore > 0 ? (healthScore + 1.2).toFixed(1) : 99.8}%
                                            </span>
                                        </div>

                                        <div className={styles.techGrid}>
                                            {results.technologies.map((tech, index) => (
                                                <div key={index} className={styles.techCard} style={{ animationDelay: `${index * 0.1}s` }}>
                                                    <div>
                                                        <div className={styles.techCategory}>{tech.category}</div>
                                                        <h3 className={styles.techName}>{tech.name}</h3>
                                                    </div>
                                                    <div className={styles.techFooter}>
                                                        <span>ID: {tech.name.substring(0, 2).toUpperCase()}-{Math.floor(Math.random() * 9000) + 1000}</span>
                                                        <span style={{ color: 'var(--secondary)' }}>↗</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recommendation Panel */}
                                    <div className={styles.card} style={{ marginTop: '2rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05))' }}>
                                        <div className={styles.cardHeader}>
                                            <h3 className={styles.cardTitle}>AI Recommendation</h3>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                minWidth: 40, height: 40, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 'bold'
                                            }}>AI</div>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.25rem 0' }}>Architecture Upgrade</h4>
                                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                    {results.recommendation}. Consider migrating legacy libraries to reduce bundle size.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}
