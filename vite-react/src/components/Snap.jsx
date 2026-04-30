import React, { useEffect } from 'react';
import errorImg from '../assets/images/ERRORYARN.png';

export default function Snap() {

    useEffect(() => {
        document.title = "404 | Page Not Found";
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <img
                    src={errorImg}
                    alt="Error 404"
                    style={styles.image}
                />
                <h1 style={styles.title}>404</h1>
                <h3 style={styles.subtitle}>Page Not Found</h3>
                <p style={styles.message}>
                    The page you are looking for doesn't exist or an other error occurred.
                    Go back, or head over to cetrea to choose a new direction.
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        margin: 0,
        padding: '16px',
        boxSizing: 'border-box'
    },
    content: {
        maxWidth: '600px',
        width: '100%',
        padding: '20px'
    },
    image: {
        width: '100%',
        maxWidth: '400px',
        height: 'auto',
        marginBottom: '20px'
    },
    title: {
        fontSize: 'clamp(2.5rem, 8vw, 4rem)',
        fontWeight: 'bold',
        margin: '10px 0',
        color: '#333'
    },
    subtitle: {
        fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
        margin: '8px 0',
        color: '#444'
    },
    message: {
        fontSize: 'clamp(0.85rem, 3vw, 0.95rem)',
        color: '#666',
        lineHeight: '1.6',
        marginTop: '10px',
        wordBreak: 'break-word'
    }
};