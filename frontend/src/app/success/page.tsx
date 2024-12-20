'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress, Alert, Paper, Divider } from '@mui/material';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!sessionId) return;

      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token') || localStorage.getItem('token');

        if (!token) {
          throw new Error('Authorization token is missing');
        }

        const response = await fetch(`http://localhost:8000/api/stripe/success?session_id=${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch payment details');

        const data = await response.json();
        setPaymentDetails(data.payment);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();

    const redirectTimeout = setTimeout(() => {
      router.push('login/');
    }, 2000);

    return () => clearTimeout(redirectTimeout);

  }, [sessionId, router]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!paymentDetails) {
    return (
      <Box sx={{ width: '100%', padding: 3 }}>
        <Alert severity="error">Failed to fetch payment details. Please contact support.</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      <Paper sx={{ padding: 3, width: '100%', boxShadow: 3 }}>
        <Typography variant="h4" sx={{ marginBottom: 2 }}>
          Payment Successful!
        </Typography>
        <Typography variant="h6" sx={{ marginBottom: 2 }}>
          Thank you for your purchase!
        </Typography>

        <Divider sx={{ margin: '20px 0' }} />

        <Typography variant="h6" sx={{ marginBottom: 1 }}>
          Payment Details
        </Typography>
        <Typography variant="body1"><strong>Amount:</strong> ${paymentDetails.amount}</Typography>
        <Typography variant="body1"><strong>Currency:</strong> {paymentDetails.currency.toUpperCase()}</Typography>
        <Typography variant="body1"><strong>Status:</strong> {paymentDetails.status}</Typography>
        <Typography variant="body1"><strong>Your payment ID:</strong> {paymentDetails.id}</Typography>
      </Paper>
    </Box>
  );
}
