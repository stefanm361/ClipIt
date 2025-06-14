import React from "react";
import './navbar.css'

export function Navbar() {
    return (
        <nav className="navigation" id="bs-override-nav">
            <a href="/" className="clipit-logo">
            <img src="/logo.png" alt="ClipIt! logo"/>
            </a>
            <div className="social-logos">
                <a href="https://www.youtube.com/">
                <img src="/youtube-logo.svg" alt="Youtube logo"/>
                </a>
                <a href="https://www.tiktok.com/">
                <img src="/tiktok-logo.svg" alt="Tiktok logo"/>
                </a>
            </div>
        </nav>
    );
  }