const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

// Load webhook secret from environment variable (separate secret for production)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET_PROD;

if (!WEBHOOK_SECRET) {
    console.error('❌ ERROR: WEBHOOK_SECRET_PROD environment variable not set!');
    console.error('Set it with: export WEBHOOK_SECRET_PROD=your_secret_here');
    process.exit(1);
}

app.use(express.json({ verify: (req, res, buf) => {
    // Store raw body for signature verification
    req.rawBody = buf.toString('utf8');
}}));

// Middleware to log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'webhook-listener-prod' });
});

// Webhook endpoint (also handle root path if Traefik strips prefix)
app.post('/webhook', (req, res) => {
    try {
        // Verify webhook signature
        const signature = req.headers['x-hub-signature-256'];
        
        if (!signature) {
            console.error('❌ Webhook rejected: No signature header');
            return res.status(401).json({ error: 'No signature provided' });
        }

        // Calculate expected signature
        const hash = crypto
            .createHmac('sha256', WEBHOOK_SECRET)
            .update(req.rawBody)
            .digest('hex');
        const expectedSignature = `sha256=${hash}`;

        // Verify signatures match
        if (signature !== expectedSignature) {
            console.error('❌ Webhook rejected: Invalid signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Get branch from webhook payload
        const branch = req.body.ref?.replace('refs/heads/', '');
        const event = req.headers['x-github-event'];

        console.log(`📦 Webhook received: ${event} on branch ${branch}`);

        // Only process push events to main branch
        if (event !== 'push') {
            console.log(`ℹ️  Ignoring event: ${event} (only push events are processed)`);
            return res.status(200).json({ message: 'Event ignored', event });
        }

        // SECURITY: Only deploy main branch, ignore dev and others
        if (branch !== 'main') {
            console.log(`⚠️  Ignoring branch: ${branch} (only main branch is deployed via webhook)`);
            console.log(`ℹ️  Dev branch deployments use separate webhook endpoint`);
            return res.status(200).json({ 
                message: 'Branch ignored', 
                branch,
                note: 'Only main branch is deployed via production webhook. Dev branch uses separate webhook.'
            });
        }

        // Deploy main branch (production)
        console.log('🚀 Starting production deployment...');
        
        // Respond immediately to GitHub (202 Accepted) to prevent timeout
        // GitHub times out after ~10 seconds, but deployment takes 16-36 seconds
        res.status(202).json({ 
            message: 'Production deployment accepted and started',
            branch: 'main',
            note: 'Deployment is running asynchronously. Check logs for progress.'
        });
        
        // Run deployment asynchronously (don't wait for response)
        const deployScript = '/app/deploy-prod-webhook.sh';
        // Pass all environment variables to the deployment script
        // The script will also load from /root/.env, but we pass process.env as backup
        exec(`bash ${deployScript}`, {
            cwd: '/app',
            env: process.env,  // Pass all environment variables (including from env_file)
            maxBuffer: 1024 * 1024 * 10  // 10MB buffer for large output
        }, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Production deployment error:', error);
                console.error('Error details:', error.message);
                console.error('Error code:', error.code);
                console.error('STDERR:', stderr);
                console.error('STDOUT (first 1000 chars):', stdout?.substring(0, 1000));
                return; // Response already sent, just log the error
            }
            
            console.log('✅ Production deployment completed successfully');
            console.log('📋 Deployment output (first 2000 chars):', stdout?.substring(0, 2000));
            
            if (stderr) {
                console.warn('⚠️  Deployment warnings:', stderr);
            }
        });

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
});

// Also handle root path (since we're using webhook-prod.laurenslist.org directly)
app.post('/', (req, res) => {
    try {
        // Same logic as /webhook endpoint
        const signature = req.headers['x-hub-signature-256'];
        
        if (!signature) {
            console.error('❌ Webhook rejected: No signature header');
            return res.status(401).json({ error: 'No signature provided' });
        }

        // Check if rawBody is available (set by verify middleware)
        if (!req.rawBody) {
            console.error('❌ Webhook rejected: No raw body available');
            return res.status(500).json({ error: 'Server configuration error: raw body not available' });
        }

        const hash = crypto
            .createHmac('sha256', WEBHOOK_SECRET)
            .update(req.rawBody)
            .digest('hex');
        const expectedSignature = `sha256=${hash}`;

        if (signature !== expectedSignature) {
            console.error('❌ Webhook rejected: Invalid signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const branch = req.body.ref?.replace('refs/heads/', '');
        const event = req.headers['x-github-event'];

        console.log(`📦 Webhook received: ${event} on branch ${branch}`);

        if (event !== 'push') {
            console.log(`ℹ️  Ignoring event: ${event} (only push events are processed)`);
            return res.status(200).json({ message: 'Event ignored', event });
        }

        if (branch !== 'main') {
            console.log(`⚠️  Ignoring branch: ${branch} (only main branch is deployed via webhook)`);
            console.log(`ℹ️  Dev branch deployments use separate webhook endpoint`);
            return res.status(200).json({ 
                message: 'Branch ignored', 
                branch,
                note: 'Only main branch is deployed via production webhook. Dev branch uses separate webhook.'
            });
        }

        console.log('🚀 Starting production deployment...');
        
        // Respond immediately to GitHub (202 Accepted) to prevent timeout
        // GitHub times out after ~10 seconds, but deployment takes 16-36 seconds
        res.status(202).json({ 
            message: 'Production deployment accepted and started',
            branch: 'main',
            note: 'Deployment is running asynchronously. Check logs for progress.'
        });
        
        // Run deployment asynchronously (don't wait for response)
        const deployScript = '/app/deploy-prod-webhook.sh';
        // Pass all environment variables to the deployment script
        // The script will also load from /root/.env, but we pass process.env as backup
        exec(`bash ${deployScript}`, {
            cwd: '/app',
            env: process.env,  // Pass all environment variables (including from env_file)
            maxBuffer: 1024 * 1024 * 10  // 10MB buffer for large output
        }, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Production deployment error:', error);
                console.error('Error details:', error.message);
                console.error('Error code:', error.code);
                console.error('STDERR:', stderr);
                console.error('STDOUT (first 1000 chars):', stdout?.substring(0, 1000));
                return; // Response already sent, just log the error
            }
            
            console.log('✅ Production deployment completed successfully');
            console.log('📋 Deployment output (first 2000 chars):', stdout?.substring(0, 2000));
            
            if (stderr) {
                console.warn('⚠️  Deployment warnings:', stderr);
            }
        });
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Production webhook listener running on port ${PORT}`);
    console.log(`📡 Waiting for GitHub webhooks...`);
    console.log(`🌐 Webhook endpoint: https://webhook-prod.laurenslist.org`);
    console.log(`🔒 Only main branch deployments are accepted`);
});

