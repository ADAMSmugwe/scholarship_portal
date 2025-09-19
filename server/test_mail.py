import os
from flask import Flask
from flask_mail import Mail, Message
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv()

# Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

print("Mail config:", {
    'MAIL_USERNAME': app.config['MAIL_USERNAME'],
    'MAIL_DEFAULT_SENDER': app.config['MAIL_DEFAULT_SENDER']
})

# Initialize Flask-Mail
mail = Mail(app)

@app.route('/')
def index():
    try:
        msg = Message(
            subject='Test Email',
            recipients=['test@example.com'],
            body='This is a test email.'
        )
        mail.send(msg)
        return 'Email sent successfully!'
    except Exception as e:
        print(f"Error details: {str(e)}")
        return f'Error sending email: {str(e)}'

if __name__ == '__main__':
    app.run(port=5002, debug=True)
