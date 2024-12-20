'use client';

import { Button, Container, Typography, Box, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push('/logout');  
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        padding: 2,
      }}
    >
      <Typography variant="h4" align="center" sx={{ marginTop: 2, color: '#333' }}>
        Welcome to the Voice-to-Text app
      </Typography>

      <Stack direction="row" spacing={2} sx={{ marginTop: 3 }}>
        <Button
          variant="contained"
          color="primary"
          href="/register"
          sx={{ width: '100%' }}
        >
          Register
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          href="/login"
          sx={{ width: '100%' }}
        >
          Login
        </Button>
      </Stack>
    </Container>
  );
}
