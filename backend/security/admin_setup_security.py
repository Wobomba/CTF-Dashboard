"""
Comprehensive security module for admin setup against OWASP Top 10
"""
import os
import time
import hashlib
import secrets
import ipaddress
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, session
# import redis  # Optional: Use Redis for production rate limiting
from werkzeug.security import check_password_hash

# Import configuration
try:
    from config import SECURITY_CONFIG, get_allowed_ips, is_ip_allowed
except ImportError:
    # Fallback configuration if config.py is not available
    SECURITY_CONFIG = {
        'MAX_SETUP_ATTEMPTS': 3,
        'SETUP_WINDOW_MINUTES': 15,
        'IP_WHITELIST': ['137.63.184.198', '127.0.0.1', '::1'],
        'REQUIRE_HTTPS': False,
        'SESSION_TIMEOUT_MINUTES': 30,
        'RATE_LIMIT_REQUESTS': 5,
        'RATE_LIMIT_WINDOW_MINUTES': 1,
        'CSRF_TOKEN_LENGTH': 32,
        'PASSWORD_MIN_LENGTH': 12,
        'PASSWORD_REQUIRE_SPECIAL': True,
        'PASSWORD_REQUIRE_UPPERCASE': True,
        'PASSWORD_REQUIRE_LOWERCASE': True,
        'PASSWORD_REQUIRE_NUMBERS': True
    }
    
    def get_allowed_ips():
        return SECURITY_CONFIG['IP_WHITELIST']
    
    def is_ip_allowed(ip):
        return ip in get_allowed_ips()

# In-memory storage for security tracking (use Redis in production)
security_storage = {}

def get_client_ip():
    """Get real client IP address"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    return request.remote_addr

def is_ip_whitelisted(ip):
    """Check if IP is in whitelist"""
    try:
        # Use the configuration function
        return is_ip_allowed(ip)
    except:
        # Fallback to basic IP checking
        allowed_ips = get_allowed_ips()
        if not allowed_ips:
            return True  # No restrictions
        
        return ip in allowed_ips

def check_https_requirement():
    """Ensure HTTPS is used in production"""
    if SECURITY_CONFIG['REQUIRE_HTTPS']:
        if not request.is_secure and not request.headers.get('X-Forwarded-Proto') == 'https':
            return False
    return True

def validate_user_agent():
    """Validate user agent for suspicious patterns"""
    user_agent = request.headers.get('User-Agent', '').lower()
    
    # Suspicious patterns
    suspicious_patterns = [
        'gobuster', 'dirb', 'dirbuster', 'wfuzz', 'burp', 'nikto', 'nmap',
        'sqlmap', 'w3af', 'zap', 'scanner', 'crawler', 'bot', 'spider',
        'python-requests', 'curl', 'wget', 'postman', 'insomnia', 'httpie',
        'automated', 'script', 'test', 'hack', 'exploit', 'payload'
    ]
    
    # Check for suspicious patterns
    for pattern in suspicious_patterns:
        if pattern in user_agent:
            return False
    
    # Check for missing or generic user agents
    if not user_agent or user_agent in ['', 'mozilla', 'browser']:
        return False
    
    # Check for reasonable user agent length
    if len(user_agent) < 10 or len(user_agent) > 500:
        return False
    
    return True

def validate_referer():
    """Validate referer header"""
    referer = request.headers.get('Referer', '')
    origin = request.headers.get('Origin', '')
    
    # Allow requests from same origin or no referer (direct access)
    if not referer and not origin:
        return True
    
    # Check if referer matches expected origin
    expected_origin = request.url_root.rstrip('/')
    if referer.startswith(expected_origin) or origin == expected_origin:
        return True
    
    return False

def rate_limit_check(ip):
    """Check rate limiting for IP"""
    current_time = time.time()
    window_start = current_time - (SECURITY_CONFIG['RATE_LIMIT_WINDOW_MINUTES'] * 60)
    
    # Clean old entries
    if ip in security_storage:
        security_storage[ip]['requests'] = [
            req_time for req_time in security_storage[ip]['requests'] 
            if req_time > window_start
        ]
    else:
        security_storage[ip] = {'requests': []}
    
    # Check if rate limit exceeded
    if len(security_storage[ip]['requests']) >= SECURITY_CONFIG['RATE_LIMIT_REQUESTS']:
        return False
    
    # Add current request
    security_storage[ip]['requests'].append(current_time)
    return True

def setup_attempt_check(ip):
    """Check if setup attempts are within limits"""
    current_time = time.time()
    window_start = current_time - (SECURITY_CONFIG['SETUP_WINDOW_MINUTES'] * 60)
    
    if ip not in security_storage:
        security_storage[ip] = {'setup_attempts': []}
    
    # Ensure setup_attempts key exists
    if 'setup_attempts' not in security_storage[ip]:
        security_storage[ip]['setup_attempts'] = []
    
    # Clean old attempts
    security_storage[ip]['setup_attempts'] = [
        attempt_time for attempt_time in security_storage[ip]['setup_attempts'] 
        if attempt_time > window_start
    ]
    
    # Check if max attempts exceeded
    if len(security_storage[ip]['setup_attempts']) >= SECURITY_CONFIG['MAX_SETUP_ATTEMPTS']:
        return False
    
    return True

def record_setup_attempt(ip):
    """Record a setup attempt"""
    current_time = time.time()
    if ip not in security_storage:
        security_storage[ip] = {'setup_attempts': []}
    
    # Ensure setup_attempts key exists
    if 'setup_attempts' not in security_storage[ip]:
        security_storage[ip]['setup_attempts'] = []
    
    security_storage[ip]['setup_attempts'].append(current_time)

def generate_csrf_token():
    """Generate CSRF token"""
    return secrets.token_urlsafe(SECURITY_CONFIG['CSRF_TOKEN_LENGTH'])

def validate_csrf_token(token):
    """Validate CSRF token"""
    if not token:
        return False
    
    # Check session CSRF token
    session_token = session.get('csrf_token')
    if not session_token:
        return False
    
    return secrets.compare_digest(token, session_token)

def validate_password_strength(password):
    """Validate password strength"""
    if len(password) < SECURITY_CONFIG['PASSWORD_MIN_LENGTH']:
        return False, f"Password must be at least {SECURITY_CONFIG['PASSWORD_MIN_LENGTH']} characters long"
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    if SECURITY_CONFIG['PASSWORD_REQUIRE_UPPERCASE'] and not has_upper:
        return False, "Password must contain at least one uppercase letter"
    
    if SECURITY_CONFIG['PASSWORD_REQUIRE_LOWERCASE'] and not has_lower:
        return False, "Password must contain at least one lowercase letter"
    
    if SECURITY_CONFIG['PASSWORD_REQUIRE_NUMBERS'] and not has_digit:
        return False, "Password must contain at least one number"
    
    if SECURITY_CONFIG['PASSWORD_REQUIRE_SPECIAL'] and not has_special:
        return False, "Password must contain at least one special character"
    
    # Check for common weak passwords
    weak_passwords = [
        'password', '123456', 'admin', 'root', 'user', 'test',
        'password123', 'admin123', 'root123', 'user123'
    ]
    
    if password.lower() in weak_passwords:
        return False, "Password is too common, please choose a stronger password"
    
    return True, "Password is strong"

def validate_input_sanitization(data):
    """Validate and sanitize input data"""
    if not isinstance(data, dict):
        return False, "Invalid data format"
    
    # Check for SQL injection patterns
    sql_patterns = [
        "'", '"', ';', '--', '/*', '*/', 'xp_', 'sp_',
        'union', 'select', 'insert', 'update', 'delete',
        'drop', 'create', 'alter', 'exec', 'execute'
    ]
    
    for key, value in data.items():
        if isinstance(value, str):
            value_lower = value.lower()
            for pattern in sql_patterns:
                if pattern in value_lower:
                    return False, f"Suspicious input detected in {key}"
    
    # Check for XSS patterns
    xss_patterns = [
        '<script', '</script>', 'javascript:', 'onload=',
        'onerror=', 'onclick=', 'onmouseover=', 'onfocus='
    ]
    
    for key, value in data.items():
        if isinstance(value, str):
            value_lower = value.lower()
            for pattern in xss_patterns:
                if pattern in value_lower:
                    return False, f"XSS attempt detected in {key}"
    
    return True, "Input validation passed"

def log_security_event(event_type, ip, details=None):
    """Log security events"""
    timestamp = datetime.utcnow().isoformat()
    event = {
        'timestamp': timestamp,
        'event_type': event_type,
        'ip': ip,
        'user_agent': request.headers.get('User-Agent', ''),
        'details': details or {}
    }
    
    # In production, log to secure logging system
    print(f"SECURITY_EVENT: {event}")

def secure_admin_setup_required(f):
    """Decorator for secure admin setup endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        client_ip = get_client_ip()
        
        # 1. IP Whitelist Check
        if not is_ip_whitelisted(client_ip):
            log_security_event('IP_NOT_WHITELISTED', client_ip)
            return jsonify({'error': 'Access denied'}), 403
        
        # 2. HTTPS Requirement
        if not check_https_requirement():
            log_security_event('HTTPS_REQUIRED', client_ip)
            return jsonify({'error': 'HTTPS required'}), 403
        
        # 3. User Agent Validation
        if not validate_user_agent():
            log_security_event('SUSPICIOUS_USER_AGENT', client_ip)
            return jsonify({'error': 'Access denied'}), 403
        
        # 4. Referer Validation
        if not validate_referer():
            log_security_event('INVALID_REFERER', client_ip)
            return jsonify({'error': 'Access denied'}), 403
        
        # 5. Rate Limiting
        if not rate_limit_check(client_ip):
            log_security_event('RATE_LIMIT_EXCEEDED', client_ip)
            return jsonify({'error': 'Rate limit exceeded'}), 429
        
        # 6. Setup Attempt Limits
        if not setup_attempt_check(client_ip):
            log_security_event('SETUP_ATTEMPTS_EXCEEDED', client_ip)
            return jsonify({'error': 'Maximum setup attempts exceeded'}), 429
        
        # 7. CSRF Protection (for POST requests)
        if request.method == 'POST':
            csrf_token = request.headers.get('X-CSRF-Token') or request.json.get('csrf_token')
            if not validate_csrf_token(csrf_token):
                log_security_event('INVALID_CSRF_TOKEN', client_ip)
                return jsonify({'error': 'Invalid CSRF token'}), 403
        
        # 8. Input Validation
        if request.method == 'POST' and request.json:
            is_valid, message = validate_input_sanitization(request.json)
            if not is_valid:
                log_security_event('INVALID_INPUT', client_ip, {'message': message})
                return jsonify({'error': 'Invalid input'}), 400
        
        # Record the attempt
        if request.method == 'POST':
            record_setup_attempt(client_ip)
        
        return f(*args, **kwargs)
    
    return decorated_function

def secure_admin_setup_check_required(f):
    """Decorator for admin setup check endpoint (less restrictive)"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        client_ip = get_client_ip()
        
        # Basic security checks for setup check
        if not validate_user_agent():
            return jsonify({'error': 'Access denied'}), 403
        
        if not rate_limit_check(client_ip):
            return jsonify({'error': 'Rate limit exceeded'}), 429
        
        return f(*args, **kwargs)
    
    return decorated_function
