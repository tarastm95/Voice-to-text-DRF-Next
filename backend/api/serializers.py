from rest_framework import serializers
from .models import User, VoiceRecord, Payment

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    clerk_id = serializers.CharField(write_only=True, required=False, allow_blank=True)  # Зробити clerk_id необов'язковим
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'clerk_id']

    def create(self, validated_data):
        password = validated_data.pop('password')
        clerk_id = validated_data.get('clerk_id', None)  # Якщо clerk_id немає, встановлюємо його в None

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password,
            clerk_id=clerk_id
        )
        return user

class VoiceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceRecord
        fields = ['id', 'title', 'transcription', 'created_at']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'stripe_payment_id', 'amount', 'status', 'created_at']
