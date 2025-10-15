"""
Security configuration for admin setup
"""
import os

# Security configuration with your specific IP
SECURITY_CONFIG = {
    # IP Whitelist - Only these IPs can access admin setup
    'ADMIN_SETUP_IP_WHITELIST': os.getenv(
        'ADMIN_SETUP_IP_WHITELIST', 
        ''
    ).split(','),
    
    # HTTPS requirement (set to false for development)
    'REQUIRE_HTTPS': os.getenv('REQUIRE_HTTPS', 'false').lower() == 'true',
    
    # Rate limiting
    'RATE_LIMIT_ENABLED': os.getenv('RATE_LIMIT_ENABLED', 'true').lower() == 'true',
    'RATE_LIMIT_REQUESTS': int(os.getenv('RATE_LIMIT_REQUESTS', '50')),
    'RATE_LIMIT_WINDOW_MINUTES': int(os.getenv('RATE_LIMIT_WINDOW_MINUTES', '1')),
    
    # Admin setup limits
    'MAX_SETUP_ATTEMPTS': int(os.getenv('MAX_SETUP_ATTEMPTS', '3')),
    'SETUP_WINDOW_MINUTES': int(os.getenv('SETUP_WINDOW_MINUTES', '15')),
    
    # Password requirements
    'PASSWORD_MIN_LENGTH': int(os.getenv('PASSWORD_MIN_LENGTH', '12')),
    'PASSWORD_REQUIRE_SPECIAL': os.getenv('PASSWORD_REQUIRE_SPECIAL', 'true').lower() == 'true',
    'PASSWORD_REQUIRE_UPPERCASE': os.getenv('PASSWORD_REQUIRE_UPPERCASE', 'true').lower() == 'true',
    'PASSWORD_REQUIRE_LOWERCASE': os.getenv('PASSWORD_REQUIRE_LOWERCASE', 'true').lower() == 'true',
    'PASSWORD_REQUIRE_NUMBERS': os.getenv('PASSWORD_REQUIRE_NUMBERS', 'true').lower() == 'true',
    
    # Session security
    'SESSION_SECURE': os.getenv('SESSION_SECURE', 'false').lower() == 'true',
    'SESSION_HTTPONLY': os.getenv('SESSION_HTTPONLY', 'true').lower() == 'true',
    'SESSION_SAMESITE': os.getenv('SESSION_SAMESITE', 'Strict'),
    
    # CSRF protection
    'CSRF_ENABLED': os.getenv('CSRF_ENABLED', 'true').lower() == 'true',
    'CSRF_TOKEN_LENGTH': int(os.getenv('CSRF_TOKEN_LENGTH', '32')),
    
    # Security logging
    'SECURITY_LOGGING': os.getenv('SECURITY_LOGGING', 'true').lower() == 'true',
    'LOG_LEVEL': os.getenv('LOG_LEVEL', 'INFO'),
}

def get_allowed_ips():
    """Get list of allowed IPs for admin setup"""
    return [ip.strip() for ip in SECURITY_CONFIG['ADMIN_SETUP_IP_WHITELIST'] if ip.strip()]

def is_ip_allowed(ip):
    """Check if IP is allowed for admin setup"""
    allowed_ips = get_allowed_ips()
    if not allowed_ips:
        return True  # No restrictions if no whitelist
    
    return ip in allowed_ips

# Log the current configuration
if SECURITY_CONFIG['SECURITY_LOGGING']:
    print(f"Security Config: Admin setup restricted to IPs: {get_allowed_ips()}")
    print(f"Security Config: HTTPS required: {SECURITY_CONFIG['REQUIRE_HTTPS']}")
    print(f"Security Config: Rate limiting: {SECURITY_CONFIG['RATE_LIMIT_ENABLED']}")
