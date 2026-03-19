---
title: "Website Security Basics Every Business Owner Should Know"
slug: "website-security-basics-business-owners"
date: "2026-03-18"
author: "Chris Garlick"
description: "Not sure if your website is secure? Here's a plain-English guide to SSL, security headers, and the common vulnerabilities most small business sites have."
keyword: "website security basics"
category: "security"
tags:
  - "website-security"
  - "ssl"
  - "website-audit"
  - "wordpress"
post_type: "how-to"
reading_time: "8 min read"
featured: false
---

# Website Security Basics Every Business Owner Should Know

Have you ever seen that little padlock icon in your browser's address bar and wondered what it actually means? Or worse — have you ever visited your own website and seen a "Not Secure" warning staring back at you? Most business owners I talk to know their website should be "secure," but when I ask what that actually involves, the answer is usually a shrug and something about SSL.

Here's the reality: website security isn't just one thing. It's a collection of basics that work together to protect your site, your data, and your customers. The good news is that most of them aren't complicated — they just need someone to actually set them up. Let me walk you through the ones that matter most.

## SSL/TLS — The Padlock Explained

Let's start with the one everyone's heard of. SSL — or more accurately, its modern replacement TLS — is what puts the padlock in your browser and the "https" at the start of your URL. But what does it actually do?

In plain English, SSL/TLS encrypts the connection between your visitor's browser and your web server. Think of it like posting a letter in a sealed envelope versus writing it on a postcard. Without SSL, everything your visitors type — passwords, email addresses, payment details — travels across the internet in plain text that anyone on the same network could potentially read.

**What you need to know:**

- Most hosting providers now include a free SSL certificate through Let's Encrypt. If yours doesn't, that's a red flag about your hosting
- SSL isn't just for e-commerce sites. Google has used HTTPS as a ranking signal since 2014, and Chrome marks any non-HTTPS site as "Not Secure" — which is a quick way to lose trust before a visitor has read a single word
- Certificates expire and need renewing. Most modern setups handle this automatically, but I've seen plenty of sites go down because a certificate quietly expired and nobody noticed

**How to check:** Visit your website and look at the address bar. If you see a padlock and "https://", you're covered. If you see "Not Secure" or just "http://", you need to sort this out immediately. Your hosting provider's support team can usually help.

## Mixed Content — The Silent Trust Killer

This is one of the sneakiest issues I come across. Your site has SSL installed, the padlock is showing — but some of your resources are still loading over plain HTTP. Images, scripts, stylesheets, fonts, or embedded content that wasn't updated when you moved to HTTPS.

What happens? Modern browsers either block the insecure content entirely (so your images don't load or your layout breaks) or they downgrade your padlock to a warning. Either way, it undermines the security you've already set up.

**Common causes:**

- Hard-coded image URLs in your content that still use `http://` instead of `https://`
- Third-party embeds or widgets that haven't been updated
- Old CSS or JavaScript files referencing insecure resources
- Content pasted from other sites with absolute HTTP URLs

**How to find it:** Open your site in Chrome, right-click, select "Inspect," and check the Console tab. Mixed content warnings show up in yellow or red. You can also use Why No Padlock (whynopadlock.com) — paste in your URL and it'll list every insecure resource on the page.

**How to fix it:** In most cases, it's a matter of updating URLs from `http://` to `https://`. If you're on WordPress, the Better Search Replace plugin lets you do this across your entire database in a few clicks. Just make sure you take a backup first.

## Admin Panel Exposure — The Unlocked Back Door

Here's something that makes me wince every time I find it: admin login pages sitting at predictable, publicly accessible URLs with no additional protection.

If your WordPress login is at `/wp-admin` or `/wp-login.php` (which it is by default), every bot on the internet already knows where to start hammering. The same goes for `/admin`, `/administrator`, `/login`, or whatever default your CMS uses. Automated bots run 24/7 trying common username and password combinations against these URLs — it's called a brute force attack, and it's staggeringly common.

**What you should do:**

- **Change the default admin URL** — On WordPress, a plugin like WPS Hide Login lets you move your login page to a custom URL. It takes about two minutes
- **Use strong, unique passwords** — I know this sounds obvious, but "admin123" and "Password1" still show up in breach databases constantly. Use a password manager like Bitwarden or 1Password and generate something random
- **Enable two-factor authentication (2FA)** — Even if someone guesses your password, they still can't get in without the second factor. Wordfence or the WP 2FA plugin make this straightforward on WordPress
- **Limit login attempts** — By default, WordPress lets you try unlimited passwords. A plugin like Limit Login Attempts Reloaded blocks IP addresses after a set number of failed tries
- **Don't use "admin" as your username** — It's the first thing bots try. Use something unique

## Outdated Software — The Risk Nobody Thinks About

This is, in my honest opinion, the single biggest security risk for small business websites — and the one that gets the least attention.

Every piece of software on your website — the CMS itself, every plugin, every theme — is written by humans. Humans make mistakes. Those mistakes sometimes create security vulnerabilities. When a vulnerability is discovered, the developers release a patch. If you don't apply that patch, your site is running software with a known, publicly documented weakness that attackers can exploit.

**The numbers are sobering:** Sucuri's annual report consistently shows that the vast majority of hacked websites were running outdated software at the time of compromise. It's not sophisticated hacking — it's automated scripts scanning the internet for sites running old versions with known vulnerabilities.

**What you should do:**

- **Enable automatic updates** where possible. WordPress core now supports auto-updates for minor releases by default. For plugins, you can enable auto-updates individually in the Plugins screen
- **Check for updates at least weekly** if you're managing things manually. The WordPress dashboard tells you exactly what needs updating
- **Remove plugins and themes you're not using** — Even deactivated plugins can be exploited if they're still on your server. If you're not using it, delete it
- **Keep PHP up to date** — Your server's PHP version matters too. Running PHP 7.4 when 8.3 is available isn't just a performance issue, it's a security one. Your hosting provider's control panel usually lets you change this

However, there are a few things to think about with auto-updates. Occasionally, an update can break something — a plugin update conflicts with your theme, or a WordPress core update changes something a plugin relies on. This is why backups are non-negotiable. As long as you have a recent backup, any update issue can be reversed in minutes.

## Security Headers — The Invisible Shield

This is the one that most business owners have never heard of, and honestly, most developers don't think about it either. Security headers are instructions your web server sends to the browser telling it how to behave when loading your site. They don't change how your site looks or works — they add layers of protection against common attacks.

Here are the ones that matter most:

### Content-Security-Policy (CSP)

Tells the browser which sources are allowed to load content on your page. If an attacker manages to inject a malicious script, CSP can prevent it from running because the browser knows it didn't come from an approved source.

This is the most powerful header, but also the trickiest to configure. Get it wrong and you'll break your own site by blocking legitimate resources. Start with a report-only mode to see what would be blocked before enforcing it.

### X-Content-Type-Options

A simple one: it prevents browsers from "sniffing" file types. Without it, a browser might interpret an uploaded file as executable code when it shouldn't. The value is always `nosniff`. Set it and forget it.

### X-Frame-Options

Controls whether your site can be embedded in an iframe on another site. Without this, attackers can overlay your site inside a malicious page and trick users into clicking things they don't intend to — it's called clickjacking. Set it to `SAMEORIGIN` to allow your own iframes but block external ones.

### Strict-Transport-Security (HSTS)

Tells browsers to always use HTTPS when connecting to your site, even if someone types `http://`. Once a browser sees this header, it won't even attempt an insecure connection for the duration you specify. This prevents downgrade attacks where someone forces a connection back to HTTP.

### Referrer-Policy

Controls how much information about the previous page gets sent when a visitor clicks a link from your site to another. Setting this to `strict-origin-when-cross-origin` is a sensible default — it shares your domain name but not the full URL path.

### Permissions-Policy

Lets you control which browser features your site can use — camera, microphone, geolocation, payment API. If your site doesn't need the camera, explicitly deny it. This limits the damage if an attacker does manage to inject code.

**How to check yours:** Head to securityheaders.com and enter your URL. It'll give you a grade from A+ to F and tell you exactly which headers are missing. I'd be surprised if most small business sites score above a D on their first check.

**How to set them:** If you're on Apache, these go in your `.htaccess` file. On Nginx, they go in your server configuration. On WordPress specifically, a plugin like Headers Security Advanced & HSTS WP can handle this without touching config files. If you're on managed hosting, your provider's support team should be able to help.

## Your Quick Security Audit Checklist

Here's a checklist you can run through right now. It won't catch everything — a proper security audit goes much deeper — but it covers the fundamentals:

### SSL & Encryption

- [ ] Site loads over HTTPS with a valid certificate
- [ ] No mixed content warnings in the browser console
- [ ] HTTP requests redirect to HTTPS automatically
- [ ] Certificate isn't expiring within the next 30 days

### Access Control

- [ ] Admin login URL has been changed from the default
- [ ] Strong, unique passwords on all admin accounts
- [ ] Two-factor authentication enabled for all admins
- [ ] Login attempts are rate-limited
- [ ] No accounts using "admin" as the username

### Software & Updates

- [ ] CMS is running the latest stable version
- [ ] All plugins and themes are up to date
- [ ] Unused plugins and themes have been deleted (not just deactivated)
- [ ] PHP version is current and supported
- [ ] Automatic backups are running (daily or weekly minimum)

### Security Headers

- [ ] Check your score at securityheaders.com
- [ ] Strict-Transport-Security is set
- [ ] X-Content-Type-Options is set to `nosniff`
- [ ] X-Frame-Options is set to `SAMEORIGIN`
- [ ] Referrer-Policy is configured
- [ ] Permissions-Policy restricts unused browser features

### General

- [ ] File and directory listings are disabled on the server
- [ ] Default error pages don't expose server information
- [ ] Contact forms have CAPTCHA or honeypot protection against spam bots
- [ ] Regular backups are stored off-site (not just on the same server)

## Wrapping Up

Website security isn't a single feature you switch on — it's a set of basics that need to be in place and maintained over time. The good news is that none of this requires deep technical expertise. An SSL certificate, sensible access controls, regular updates, and a handful of security headers will put you ahead of the vast majority of small business websites.

The businesses that get caught out are almost always the ones who assumed their hosting provider or developer had "handled it" and never checked. A quick run through the checklist above will tell you where you stand in about ten minutes.

If you'd like a proper look under the bonnet, get in touch for a security audit. I'll check everything on this list and more, and give you a clear, prioritised plan for what to fix first — no scare tactics, just practical advice.

<!-- Internal linking suggestions:
- Link "security audit" to the PagePulser audit/pricing page
- Link "mixed content" to a technical deep-dive post if one exists
- Link "Core Web Vitals" or "page speed" to the CWV explainer post
- Link "accessibility" to the web accessibility 2026 post
- Link "WordPress" to the WordPress vs Wix comparison if published
-->
