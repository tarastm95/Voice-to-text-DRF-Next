from django.contrib.auth.models import AbstractUser
from django.db import models

# Модель користувача
class User(AbstractUser):
    clerk_id = models.CharField(max_length=100, unique=True, null=True, blank=True)  # Ідентифікатор із Clerk

# Модель запису Voice-to-Text
class VoiceRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='records')
    title = models.CharField(max_length=255)
    transcription = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

# Модель платежу
class Payment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    stripe_payment_id = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    currency = models.CharField(max_length=10, default='USD')