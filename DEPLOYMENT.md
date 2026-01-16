# Deployment Guide - Pulse Cold Chain Monitor

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

#### Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd c:\Users\crpla\OneDrive\Desktop\pulse
   vercel
   ```

4. **Configure Environment Variables**
   
   In the Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `GOOGLE_CREDENTIALS` (if using Sheets)
   - Add `GOOGLE_SHEET_ID` (if using Sheets)

5. **Production Deployment**
   ```bash
   vercel --prod
   ```

#### Important Notes:
- Vercel serverless functions have a 10-second timeout by default
- For long-running Modbus connections, consider upgrading to Pro plan
- Set `VERCEL_TIMEOUT` environment variable if needed

---

### Option 2: Self-Hosted (Node.js Server)

For on-premise deployment with direct PLC access.

#### Prerequisites:
- Ubuntu 20.04+ or Windows Server
- Node.js 20+
- PM2 (process manager)
- Nginx (reverse proxy)

#### Steps:

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd pulse
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Production Bundle**
   ```bash
   npm run build
   ```

4. **Install PM2**
   ```bash
   npm install -g pm2
   ```

5. **Start Application**
   ```bash
   pm2 start npm --name "pulse" -- start
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx** (Optional)
   
   Create `/etc/nginx/sites-available/pulse`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pulse /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

7. **SSL Certificate** (Recommended)
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

### Option 3: Docker Deployment

#### Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
```

#### Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  pulse:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GOOGLE_CREDENTIALS=${GOOGLE_CREDENTIALS}
      - GOOGLE_SHEET_ID=${GOOGLE_SHEET_ID}
    restart: unless-stopped
    networks:
      - pulse-network

networks:
  pulse-network:
    driver: bridge
```

#### Deploy:

```bash
docker-compose up -d
```

---

## 🔒 Security Considerations

### 1. Network Security

- **Firewall Rules**: Only allow necessary ports (80, 443, 502 for Modbus)
- **VPN Access**: Consider VPN for remote access to PLC network
- **Network Segmentation**: Isolate PLC network from public internet

### 2. Environment Variables

- Never commit `.env.local` to version control
- Use secrets management (Vercel Secrets, AWS Secrets Manager, etc.)
- Rotate service account credentials regularly

### 3. API Security

Add authentication to webhook endpoints:

```javascript
// pages/api/alarms.js
export default async function handler(req, res) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_SECRET_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // ... rest of handler
}
```

### 4. HTTPS

Always use HTTPS in production:
- Vercel provides automatic HTTPS
- Self-hosted: Use Let's Encrypt certificates
- Docker: Use Nginx reverse proxy with SSL

---

## 📊 Monitoring & Maintenance

### Application Monitoring

**PM2 Monitoring:**
```bash
pm2 monit
pm2 logs pulse
pm2 restart pulse
```

**Health Check Endpoint:**

Create `pages/api/health.js`:
```javascript
export default function handler(req, res) {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
}
```

### Database Backups (Google Sheets)

- Set up automatic exports from Google Sheets
- Use Google Takeout for periodic backups
- Consider migrating to PostgreSQL for production

### Log Management

**Structured Logging:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

---

## 🔧 Performance Optimization

### 1. Enable Caching

Add to `next.config.ts`:
```typescript
module.exports = {
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
}
```

### 2. Optimize Images

Use Next.js Image component:
```javascript
import Image from 'next/image';

<Image 
    src="/warehouse-map.png" 
    alt="Warehouse" 
    width={1920} 
    height={1080}
    priority
/>
```

### 3. Connection Pooling

For high-frequency Modbus polling, implement connection pooling in `lib/modbus.js`.

---

## 🐛 Troubleshooting Production Issues

### Issue: Modbus Connection Timeouts

**Solution:**
- Increase timeout in `lib/modbus.js`
- Check network latency between server and PLC
- Verify firewall rules

### Issue: High Memory Usage

**Solution:**
```bash
pm2 start npm --name "pulse" -- start --max-memory-restart 500M
```

### Issue: Slow Dashboard Loading

**Solution:**
- Enable Next.js production optimizations
- Use CDN for static assets
- Implement Redis caching for alarm history

---

## 📞 Support Checklist

Before going live:

- [ ] Test all sensors with actual PLC
- [ ] Verify alarm notifications work
- [ ] Test failover scenarios (PLC offline, network issues)
- [ ] Set up monitoring and alerting
- [ ] Document PLC IP addresses and credentials
- [ ] Train operators on dashboard usage
- [ ] Create runbook for common issues
- [ ] Set up backup power for server
- [ ] Configure automatic restarts on failure

---

## 🔄 Update Strategy

### Rolling Updates:

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build new version
npm run build

# Restart with zero downtime
pm2 reload pulse
```

### Rollback:

```bash
pm2 stop pulse
git checkout <previous-commit>
npm install
npm run build
pm2 start pulse
```

---

**For production support, maintain a 24/7 on-call rotation for critical cold chain facilities.**
