/**
 * Application Configuration
 * 
 * Edit these values to customize the app without touching component code.
 * All branding, metadata, and feature flags are centralized here.
 */

export const APP_CONFIG = {
  // ===== BRANDING =====
  name: 'Dead Protection',
  tagline: 'Protect Your Scripts',
  description: 'Advanced Lua script protection and distribution platform. Keep your code safe from leaks with our powerful whitelist system.',
  
  // ===== METADATA (SEO) =====
  meta: {
    title: 'Dead Protection - Lua Script Protection Platform',
    description: 'Advanced Lua script protection and distribution platform. Keep your code safe from leaks with our powerful whitelist system.',
    author: 'Dead Protection',
    ogImage: 'https://lovable.dev/opengraph-image-p98pqg.png',
  },

  // ===== INTEGRATIONS =====
  integrations: {
    // Cloudflare Turnstile CAPTCHA - get your keys at https://dash.cloudflare.com/turnstile
    // Leave empty to disable CAPTCHA
    turnstileSiteKey: '',
  },

  // ===== FOOTER =====
  footer: {
    copyright: `© ${new Date().getFullYear()} ScriptGuard. All rights reserved.`,
  },

  // ===== LANDING PAGE CONTENT =====
  landing: {
    hero: {
      title: 'Protect',
      titleHighlight: 'Your Scripts',
      subtitle: 'Advanced Lua script protection and distribution platform. Keep your code safe from leaks with our powerful whitelist system.',
      primaryCta: 'Start Protecting',
      secondaryCta: 'Learn More',
    },
    features: [
      {
        icon: 'Lock',
        title: 'Secure Protection',
        description: 'Advanced encryption and obfuscation to protect your scripts from unauthorized access and leaks.',
      },
      {
        icon: 'Users',
        title: 'Whitelist System',
        description: 'Control access with Discord and Roblox ID whitelisting. Set time-based access for different tiers.',
      },
      {
        icon: 'Zap',
        title: 'Analytics Dashboard',
        description: 'Track script executions, monitor usage, and manage all your protected scripts from one dashboard.',
      },
    ],
    cta: {
      title: 'Ready to protect your scripts?',
      subtitle: 'Join developers who trust ScriptGuard to keep their code secure.',
      buttonText: 'Create Free Account',
    },
  },

  // ===== AUTH PAGE CONTENT =====
  auth: {
    login: {
      title: 'Welcome Back',
      subtitle: 'Sign in to access your dashboard',
    },
    signup: {
      title: 'Create Account',
      subtitle: 'Start protecting your scripts today',
    },
  },

  // ===== DASHBOARD CONTENT =====
  dashboard: {
    title: 'Dashboard',
    stats: {
      totalScripts: 'Total Scripts',
      totalExecutions: 'Total Executions',
      activeWhitelists: 'Active Whitelists',
    },
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
