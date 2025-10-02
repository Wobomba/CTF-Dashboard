#!/usr/bin/env python3
"""
Initialize database with sample data for RENU-CERT CyberLab
"""

import sys
import os
from datetime import datetime
from werkzeug.security import generate_password_hash

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import db
from models.user import User
from models.challenge import Challenge, ChallengeCategory, Submission
from models.progress import UserProgress

def create_categories():
    
    """Create challenge categories"""
    categories = [
        {
            'name': 'Incident Response',
            'description': 'Learn to respond to and investigate security incidents',
            'icon': 'shield-alert',
            'color': '#EF4444'
        },
        {
            'name': 'Threat Hunting',
            'description': 'Proactively search for threats in your environment',
            'icon': 'search',
            'color': '#3B82F6'
        },
        {
            'name': 'Digital Forensics',
            'description': 'Investigate digital evidence and artifacts',
            'icon': 'magnifying-glass',
            'color': '#8B5CF6'
        },
        {
            'name': 'Threat Intelligence',
            'description': 'Analyze and understand cyber threats and actors',
            'icon': 'brain',
            'color': '#F59E0B'
        },
        {
            'name': 'Network Security',
            'description': 'Secure and monitor network infrastructure',
            'icon': 'network',
            'color': '#10B981'
        },
        {
            'name': 'Malware Analysis',
            'description': 'Reverse engineer and analyze malicious software',
            'icon': 'bug',
            'color': '#DC2626'
        },
        {
            'name': 'OSINT',
            'description': 'Open Source Intelligence gathering and analysis',
            'icon': 'globe',
            'color': '#059669'
        },
        {
            'name': 'CTF Challenges',
            'description': 'Capture The Flag style security challenges',
            'icon': 'flag',
            'color': '#7C3AED'
        }
    ]
    
    created_categories = {}
    for cat_data in categories:
        category = ChallengeCategory.query.filter_by(name=cat_data['name']).first()
        if not category:
            category = ChallengeCategory(**cat_data)
            db.session.add(category)
            db.session.flush()  # Get the ID
        created_categories[cat_data['name']] = category
    
    return created_categories

def create_sample_challenges(categories):
    """Create sample challenges"""
    challenges = [
        {
            'title': 'Suspicious Login Investigation',
            'description': 'A user reported unusual activity on their account. Investigate the login logs to determine if this was a legitimate access or a security incident.',
            'scenario': 'Sarah from the marketing department contacted the IT helpdesk reporting that she received an email notification about a login to her account from an unfamiliar location. She claims she was not working at that time and suspects her account may have been compromised.',
            'instructions': '''Analyze the provided login logs and determine:

1. Was this a legitimate login or a security incident?
2. What evidence supports your conclusion?
3. What immediate actions should be taken?

Review the log entries carefully and look for indicators of compromise or legitimate access patterns.''',
            'hints': [
                'Check the source IP address and geolocation',
                'Look at the timing of the login attempt',
                'Compare with the user\'s normal login patterns',
                'Check for any failed login attempts'
            ],
            'challenge_type': 'investigation',
            'difficulty': 'beginner',
            'points': 100,
            'time_limit': 30,
            'answer_type': 'text',
            'correct_answer': 'security incident',
            'answer_format': 'Enter "security incident" or "legitimate access"',
            'validation_regex': r'(?i)^security\s+incident$',
            'is_published': True,
            'is_featured': True,
            'category': 'Incident Response'
        },
        {
            'title': 'Network Traffic Analysis',
            'description': 'Analyze suspicious network traffic to identify potential data exfiltration.',
            'scenario': 'The network monitoring system has flagged unusual outbound traffic patterns from a critical server. The traffic appears to be occurring during off-hours and involves large data transfers to an external IP address.',
            'instructions': '''Examine the network traffic capture and answer the following:

1. What type of protocol is being used for the suspicious traffic?
2. What is the destination IP address?
3. What evidence suggests this might be data exfiltration?
4. What is the approximate amount of data transferred?

Use your network analysis skills to identify the threat.''',
            'hints': [
                'Look for protocols commonly used for data transfer',
                'Check the packet sizes and frequency',
                'Examine the destination IP reputation',
                'Look for patterns in the timing'
            ],
            'challenge_type': 'analysis',
            'difficulty': 'intermediate',
            'points': 200,
            'time_limit': 45,
            'answer_type': 'text',
            'correct_answer': 'DNS tunneling',
            'answer_format': 'Enter the type of attack/technique used',
            'is_published': True,
            'is_featured': True,
            'category': 'Threat Hunting',
            'file_attachments': [
                {
                    'name': 'network_traffic.pcap',
                    'size': '2.4 MB',
                    'password': 'btl0',
                    'url': '/files/network_traffic.pcap'
                },
                {
                    'name': 'analysis_guide.pdf',
                    'size': '1.1 MB',
                    'password': None,
                    'url': '/files/analysis_guide.pdf'
                }
            ]
        },
        {
            'title': 'Malware Hash Analysis',
            'description': 'A suspicious file was found on a workstation. Analyze the file hash to determine its nature.',
            'scenario': 'During a routine security scan, a file named "invoice.pdf.exe" was discovered in a user\'s downloads folder. The file was immediately quarantined, and you\'ve been provided with its MD5 hash for analysis.',
            'instructions': '''Given the MD5 hash: d41d8cd98f00b204e9800998ecf8427e

Research this hash and determine:
1. Is this file malicious?
2. What type of malware is it (if any)?
3. What should be the next steps?

Use threat intelligence resources to analyze the hash.''',
            'hints': [
                'Use online threat intelligence platforms',
                'Check multiple hash databases',
                'Look for behavior reports',
                'This hash might be special - think about what it represents'
            ],
            'challenge_type': 'investigation',
            'difficulty': 'beginner',
            'points': 150,
            'time_limit': 20,
            'answer_type': 'text',
            'correct_answer': 'empty file',
            'answer_format': 'Describe what this hash represents',
            'is_published': True,
            'category': 'Threat Intelligence'
        },
        {
            'title': 'SQL Injection Discovery',
            'description': 'Identify SQL injection vulnerabilities in web application logs.',
            'scenario': 'The web application team has noticed some unusual database errors in their logs. They suspect that someone might be attempting SQL injection attacks against their application.',
            'instructions': '''Review the web server logs and identify:

1. Which parameter is vulnerable to SQL injection?
2. What type of SQL injection technique is being used?
3. Was the attack successful?

Look for SQL injection patterns in the HTTP requests.''',
            'hints': [
                'Look for SQL keywords in URL parameters',
                'Check for error messages that reveal database information',
                'Look for union-based injection attempts',
                'Check the HTTP response codes'
            ],
            'challenge_type': 'analysis',
            'difficulty': 'intermediate',
            'points': 250,
            'time_limit': 40,
            'answer_type': 'flag',
            'correct_answer': 'flag{union_select_attack}',
            'answer_format': 'flag{technique_name}',
            'is_published': True,
            'category': 'Network Security',
            'file_attachments': [
                {
                    'name': 'web_logs.zip',
                    'size': '5.2 MB',
                    'password': 'BTLO',
                    'url': '/files/web_logs.zip'
                }
            ]
        },
        {
            'title': 'Phishing Email Analysis',
            'description': 'Analyze a suspected phishing email to determine its legitimacy and threat level.',
            'scenario': 'An employee received an email claiming to be from their bank asking them to verify their account information. They forwarded it to the security team for analysis before taking any action.',
            'instructions': '''Examine the email headers and content to determine:

1. Is this email legitimate or phishing?
2. What indicators suggest it\'s malicious?
3. What is the likely goal of this attack?
4. What action should be taken?

Pay attention to sender information, links, and social engineering tactics.''',
            'hints': [
                'Check the sender\'s email domain carefully',
                'Examine any embedded links without clicking them',
                'Look for urgency and fear-based language',
                'Check for spelling and grammar errors'
            ],
            'challenge_type': 'investigation',
            'difficulty': 'beginner',
            'points': 120,
            'time_limit': 25,
            'answer_type': 'multiple_choice',
            'correct_answer': 'credential_harvesting',
            'answer_format': 'Select the primary goal: credential_harvesting, malware_delivery, financial_fraud',
            'is_published': True,
            'is_featured': True,
            'category': 'OSINT'
        },
        {
            'title': 'Memory Dump Analysis',
            'description': 'Analyze a memory dump from a potentially compromised system to identify malicious processes.',
            'scenario': 'A server has been exhibiting unusual behavior including slow performance and unexpected network connections. A memory dump was captured for analysis.',
            'instructions': '''Using memory forensics techniques, identify:

1. What malicious processes are running?
2. What persistence mechanisms are being used?
3. What network connections has the malware established?
4. What data might have been compromised?

Use tools like Volatility for your analysis.''',
            'hints': [
                'Look for processes with suspicious names or locations',
                'Check for code injection techniques',
                'Examine network connections and open handles',
                'Look for registry modifications'
            ],
            'challenge_type': 'analysis',
            'difficulty': 'advanced',
            'points': 400,
            'time_limit': 90,
            'answer_type': 'text',
            'correct_answer': 'powershell empire',
            'answer_format': 'Enter the name of the malware/framework identified',
            'is_published': True,
            'category': 'Digital Forensics'
        },
        {
            'title': 'Ransomware Identification',
            'description': 'Identify the ransomware family based on the ransom note and file encryption patterns.',
            'scenario': 'A workstation was found with encrypted files and a ransom note. The user reported that they opened an email attachment yesterday that seemed suspicious.',
            'instructions': '''Based on the ransom note content and file extensions, determine:

1. What ransomware family is this?
2. Is there a known decryptor available?
3. What was the likely infection vector?
4. What containment steps should be taken immediately?

The encrypted files have the extension ".locked" and the ransom note mentions "CryptoLocker2023".''',
            'hints': [
                'Research the ransom note indicators',
                'Check file extension patterns',
                'Look up the ransomware name mentioned',
                'Check threat intelligence databases for IOCs'
            ],
            'challenge_type': 'investigation',
            'difficulty': 'intermediate',
            'points': 300,
            'time_limit': 35,
            'answer_type': 'text',
            'correct_answer': 'cryptolocker variant',
            'answer_format': 'Enter the ransomware family name',
            'is_published': True,
            'category': 'Malware Analysis'
        },
        {
            'title': 'YARA Rule Creation',
            'description': 'Create a YARA rule to detect a specific malware family based on provided samples.',
            'scenario': 'Multiple workstations have been infected with a new malware variant. The security team needs to create detection rules to identify this threat across the environment.',
            'instructions': '''Create a YARA rule that can detect this malware family based on the following characteristics:

- Contains the string "backdoor_payload_2023"
- Has PE section named ".malware"
- File size is typically between 50KB and 200KB
- Contains encrypted configuration data

Write a complete YARA rule with appropriate metadata.''',
            'hints': [
                'Include rule metadata with author and description',
                'Use string matching for the payload identifier',
                'Add PE section checks',
                'Include file size conditions',
                'Use the "all of them" condition'
            ],
            'challenge_type': 'ctf',
            'difficulty': 'advanced',
            'points': 350,
            'time_limit': 60,
            'answer_type': 'text',
            'correct_answer': 'rule malware_detector',
            'answer_format': 'Enter the rule name (first line of your YARA rule)',
            'validation_regex': r'rule\s+\w+',
            'is_published': True,
            'category': 'CTF Challenges'
        }
    ]
    
    # Get any admin user or create a temporary one for initialization
    admin_user = User.query.filter_by(is_admin=True).first()
    if not admin_user:
        # Create a temporary admin user for initialization purposes
        admin_user = User(
            username='temp_admin',
            email='temp@admin.local',
            password_hash=generate_password_hash('temp_password'),
            is_admin=True,
            is_active=True,
            is_verified=True
        )
        db.session.add(admin_user)
        db.session.flush()  # Flush to get the ID
    
    for challenge_data in challenges:
        # Get category
        category = categories[challenge_data.pop('category')]
        challenge_data['category_id'] = category.id
        challenge_data['created_by'] = admin_user.id
        challenge_data['publish_date'] = datetime.utcnow()
        
        # Check if challenge already exists
        existing = Challenge.query.filter_by(title=challenge_data['title']).first()
        if not existing:
            challenge = Challenge(**challenge_data)
            db.session.add(challenge)

def main():
    """Initialize the database with sample data"""
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        
        print("Creating challenge categories...")
        categories = create_categories()
        
        print("Creating sample challenges...")
        create_sample_challenges(categories)
        
        # Commit all changes
        db.session.commit()
        
        print("Database initialization complete!")
        print(f"Created {len(categories)} categories")
        print(f"Challenge count: {Challenge.query.count()}")
        print(f"User count: {User.query.count()}")

if __name__ == '__main__':
    main()
