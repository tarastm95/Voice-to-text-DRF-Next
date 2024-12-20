from django.urls import path
from .views import VoiceToTextView, CreateCheckoutSessionView, UserRegistrationView, PaymentSuccessView, UserDetailView, \
    UserVoiceRecordsView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('voice-to-text/', VoiceToTextView.as_view(), name='voice-to-text'),

    path('create-checkout-session/', CreateCheckoutSessionView.as_view(), name='create-checkout-session'),

    path('api/payment-success/', PaymentSuccessView.as_view(), name='payment-success'),  # Доданий маршрут
    path('auth/user/', UserDetailView.as_view(), name='user-details'),
    # реєстрація:
    path('register/', UserRegistrationView.as_view(), name='register'),
    # Ендпоінт для отримання токена (логін користувача)
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),

    # Ендпоінт для оновлення токена (отримання нового токена доступу за допомогою токена оновлення)
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Ендпоінт для верифікації токена (перевірка дійсності токена доступу)
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    path('api/stripe/success', PaymentSuccessView.as_view(), name='payment-success'),

    path('voice-records/', UserVoiceRecordsView.as_view(), name='user-voice-records'),
]
