import random
from datetime import datetime, timedelta

# Configuration
PARTICIPANTS = ["Romeo", "Juliet"]
FILE_NAME = "romeo_juliet_huge.txt"
TOTAL_MESSAGES = 1000

# Expanded message pool to ensure variety in Word Clouds and Sentiment
MESSAGE_POOL = [
    "O, speak again, bright angel! ✨",
    "Wherefore art thou Romeo? 🌹",
    "I am fortune's fool!",
    "By a name I know not how to tell thee who I am.",
    "Parting is such sweet sorrow. 🌙",
    "Dost thou love me? I know thou wilt say 'Ay'.",
    "My bounty is as boundless as the sea, my love as deep.",
    "Wisely and slow; they stumble that run fast.",
    "Good night, good night! 😴",
    "A thousand times the worse, to want thy light.",
    "Love is a smoke raised with the fume of sighs. 💨",
    "What's in a name? That which we call a rose...",
    "Under love's heavy burden do I sink. 💔",
    "I defy you, stars!",
    "❤️", "✨", "🔥", "🕊️", "🥀",
    "See, how she leans her cheek upon her hand!",
    "O, that I were a glove upon that hand.",
    "Too early seen unknown, and known too late!",
    "My only love sprung from my only hate."
]

# System messages to test your parser's filtering logic
SYSTEM_MESSAGES = [
    "Messages and calls are end-to-end encrypted.",
    "Juliet changed the group description.",
    "Romeo joined using an invite link.",
    "This message was deleted"
]

def generate_whatsapp_data():
    # Start date: January 1st, 2026
    current_time = datetime(2026, 1, 1, 8, 0, 0)
    
    with open(FILE_NAME, "w", encoding="utf-8") as f:
        for i in range(TOTAL_MESSAGES):
            # Advance time randomly (1 to 120 minutes) to create peaks and lulls
            current_time += timedelta(minutes=random.randint(1, 120))
            
            # 5% chance of a system message
            if random.random() < 0.05:
                timestamp = current_time.strftime("[%d/%m/%y, %H:%M:%S]")
                msg = random.choice(SYSTEM_MESSAGES)
                f.write(f"{timestamp} {msg}\n")
                continue

            # Standard message format
            timestamp = current_time.strftime("[%d/%m/%y, %H:%M:%S]")
            sender = random.choice(PARTICIPANTS)
            msg = random.choice(MESSAGE_POOL)
            
            # Occasionally generate a very long message for the "Essay Writer" persona
            if random.random() < 0.1:
                msg = (msg + " ") * random.randint(3, 10)

            f.write(f"{timestamp} {sender}: {msg}\n")

    print(f"Successfully generated {TOTAL_MESSAGES} messages in {FILE_NAME}")

if __name__ == "__main__":
    generate_whatsapp_data()