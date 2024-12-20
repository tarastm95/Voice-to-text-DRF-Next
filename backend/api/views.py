import os

from django.db import IntegrityError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import VoiceRecord, Payment, User
from .serializers import VoiceRecordSerializer, PaymentSerializer, UserRegistrationSerializer
import openai
import stripe

openai.api_key = os.getenv('OPENAI_API_KEY')

stripe.api_key = os.getenv('STRIPE_API_KEY')

def transcribe_audio(audio_file):
    try:
        response = openai.Audio.transcribe(
            model="whisper-1",
            file=audio_file
        )
        return response['text']
    except Exception as e:
        raise Exception(f"Error transcribing audio: {str(e)}")

class VoiceToTextView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.records.count() >= 2 and not user.payments.filter(status="succeeded").exists():
            return Response({"error": "Please complete payment to upload more records."}, status=status.HTTP_402_PAYMENT_REQUIRED)

        audio_file = request.FILES.get('file')
        if not audio_file:
            return Response({"error": "File is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transcription = transcribe_audio(audio_file)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        record = VoiceRecord.objects.create(
            user=user,
            title=audio_file.name,
            transcription=transcription
        )
        serializer = VoiceRecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class CreateCheckoutSessionView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {'name': 'Voice-to-Text Additional Uploads'},
                        'unit_amount': 500,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url='http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url='http://localhost:3000/cancel',
                client_reference_id=user.id,
            )
            return Response({"url": checkout_session.url}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PaymentSuccessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        session_id = request.GET.get('session_id')
        if not session_id:
            return Response({"error": "session_id is required"}, status=400)

        try:
            session = stripe.checkout.Session.retrieve(session_id)
            stripe_payment_id = session['payment_intent']

            if Payment.objects.filter(stripe_payment_id=stripe_payment_id).exists():
                payment = Payment.objects.get(stripe_payment_id=stripe_payment_id)
                return Response({
                    "message": "Payment already processed",
                    "payment": {
                        "id": payment.id,
                        "amount": payment.amount,
                        "currency": payment.currency,
                        "status": payment.status
                    }
                }, status=200)

            payment = Payment.objects.create(
                user=request.user,
                stripe_payment_id=stripe_payment_id,
                amount=session['amount_total'] / 100,
                currency=session['currency'],
                status='succeeded'
            )
            return Response({
                "message": "Payment successful",
                "payment": {
                    "id": payment.id,
                    "amount": payment.amount,
                    "currency": payment.currency,
                    "status": payment.status
                }
            }, status=201)

        except stripe.error.InvalidRequestError as e:
            return Response({"error": f"Invalid request: {str(e)}"}, status=400)
        except stripe.error.AuthenticationError as e:
            return Response({"error": "Authentication with Stripe API failed"}, status=401)
        except stripe.error.APIConnectionError as e:
            return Response({"error": "Network communication with Stripe failed"}, status=500)
        except stripe.error.StripeError as e:
            return Response({"error": f"Stripe API error: {str(e)}"}, status=500)
        except IntegrityError:
            return Response({"error": "Duplicate payment detected"}, status=400)

class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "User registered successfully",
                "user": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "date_joined": user.date_joined,
        }

        return Response(user_data, status=status.HTTP_200_OK)

class UserVoiceRecordsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        voice_records = VoiceRecord.objects.filter(user=user)

        if not voice_records:
            return Response({"message": "No voice records found for this user."}, status=status.HTTP_404_NOT_FOUND)

        serializer = VoiceRecordSerializer(voice_records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
