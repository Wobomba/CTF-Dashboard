# 🚀 Production Deployment Guide - Avoiding Mixed Content Errors

This guide provides the **best practices** for deploying your RENU-CERT CyberLab application to production while completely avoiding Mixed Content errors.

## 🎯 The Problem

Mixed Content errors occur when:
- Your frontend is served over **HTTPS** (secure)
- But your API calls are made to **HTTP** endpoints (insecure)
- Modern browsers block these insecure requests for security

## ✅ The Solution

Deploy with **HTTPS everywhere** from the start using our automated deployment script.

---

## 🚀 Quick Deployment (Recommended)

### **Step 1: Prepare Your Server**

```bash
# 1. SSH into your production server
ssh user@your-production-server

# 2. Clone or pull the latest code
git clone https://github.com/Wobomba/CTF-Dashboard.git
cd CTF-Dashboard
git checkout Development
```

### **Step 2: Install SSL Certificates**

```bash
# 1. Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# 2. Copy your SSL certificates
sudo cp /path/to/your/certificate.pem /etc/nginx/ssl/cert.pem
sudo cp /path/to/your/private.key /etc/nginx/ssl/key.pem

# 3. Set proper permissions
sudo chmod 600 /etc/nginx/ssl/key.pem
sudo chmod 644 /etc/nginx/ssl/cert.pem
```

### **Step 3: Deploy with HTTPS (One Command)**

```bash
# Set your domain and run the deployment script
DOMAIN=cyberlab.renu.ac.ug ./deploy-https-production.sh
```

**That's it!** The script will:
- ✅ Configure frontend for HTTPS API calls
- ✅ Build frontend with HTTPS configuration
- ✅ Set up Nginx for HTTPS
- ✅ Deploy with Docker
- ✅ Verify everything works

---

## 🔧 Manual Deployment (Step-by-Step)

If you prefer manual control:

### **Step 1: Configure Frontend for HTTPS**

```bash
cd frontend

# Create production environment file
cat > .env.production << EOF
VITE_API_URL=https://cyberlab.renu.ac.ug/api
VITE_NODE_ENV=production
EOF

# Build with HTTPS configuration
npm ci
npm run build
cd ..
```

### **Step 2: Configure Backend Environment**

```bash
# Create production environment
cp env.prod.example .env

# Edit with your values
nano .env
```

**Important settings in `.env`:**
```bash
REQUIRE_HTTPS=true
FLASK_ENV=production
# ... other settings
```

### **Step 3: Deploy with Docker**

```bash
# Deploy production containers
docker-compose -f docker-compose.prod.yml up --build -d
```

---

## 🔍 Verification Steps

After deployment, verify everything works:

### **1. Test HTTPS Redirect**
```bash
curl -I http://cyberlab.renu.ac.ug
# Should return: HTTP/1.1 301 Moved Permanently
```

### **2. Test HTTPS Endpoint**
```bash
curl -k https://cyberlab.renu.ac.ug/health
# Should return: healthy
```

### **3. Test API over HTTPS**
```bash
curl -k https://cyberlab.renu.ac.ug/api/health
# Should return JSON with status
```

### **4. Browser Verification**
1. Open `https://cyberlab.renu.ac.ug` in browser
2. Open Developer Tools (F12)
3. Check **Console** tab - should be no Mixed Content warnings
4. Check **Network** tab - all API calls should be HTTPS

---

## 🛠️ Troubleshooting

### **Mixed Content Still Occurring?**

1. **Check Frontend Build:**
   ```bash
   # Verify API URL in built files
   grep -r "https://" dist/assets/
   ```

2. **Check Environment Variables:**
   ```bash
   cat frontend/.env.production
   # Should show: VITE_API_URL=https://your-domain.com/api
   ```

3. **Rebuild Frontend:**
   ```bash
   cd frontend
   rm -rf dist/
   npm run build
   cd ..
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

### **SSL Certificate Issues?**

1. **Check Certificate:**
   ```bash
   openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout
   ```

2. **Test SSL Connection:**
   ```bash
   openssl s_client -connect cyberlab.renu.ac.ug:443
   ```

### **API Calls Still Using HTTP?**

1. **Check Browser Console** for errors
2. **Verify VITE_API_URL** is set correctly
3. **Clear Browser Cache** and reload
4. **Check Network Tab** in Developer Tools

---

## 📊 Production Checklist

Before going live, ensure:

- [ ] **SSL Certificates** installed and valid
- [ ] **Domain DNS** points to your server
- [ ] **Frontend built** with HTTPS API URL
- [ ] **Nginx configured** for HTTPS
- [ ] **HTTP redirects** to HTTPS
- [ ] **No Mixed Content** warnings in browser
- [ ] **All API calls** use HTTPS
- [ ] **Admin setup** accessible over HTTPS

---

## 🎯 Best Practices

### **1. Always Use HTTPS in Production**
- Never mix HTTP and HTTPS
- Use HTTPS for all API calls
- Redirect HTTP to HTTPS

### **2. Environment Variables**
- Set `VITE_API_URL=https://your-domain.com/api`
- Use `REQUIRE_HTTPS=true` in backend
- Configure proper SSL certificates

### **3. Testing**
- Test in multiple browsers
- Check Developer Tools console
- Verify all network requests are HTTPS

### **4. Monitoring**
- Monitor SSL certificate expiration
- Check for Mixed Content warnings
- Monitor API response times

---

## 🚀 Quick Commands

```bash
# Deploy with HTTPS (recommended)
DOMAIN=cyberlab.renu.ac.ug ./deploy-https-production.sh

# Check deployment status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Update deployment
git pull origin Development
./deploy-https-production.sh
```

---

## 🎉 Expected Results

After following this guide:

- ✅ **No Mixed Content Errors** in browser console
- ✅ **All API calls use HTTPS** automatically
- ✅ **Secure communication** between frontend and backend
- ✅ **Production-ready** application with SSL
- ✅ **Professional deployment** with proper HTTPS

Your application will be completely secure and free from Mixed Content errors! 🚀✨
