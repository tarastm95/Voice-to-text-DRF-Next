'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Stack,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ username: string; email: string } | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [voiceRecords, setVoiceRecords] = useState<any[]>([]); // Стан для збереження голосових записів

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      try {
        const res = await fetch('http://localhost:8000/auth/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (res.ok) {
          const data = await res.json();
          const accessToken = data.access;
          localStorage.setItem('accessToken', accessToken);
          fetchUserData(accessToken);
          fetchVoiceRecords(accessToken); // Отримуємо голосові записи після входу
        } else {
          setError('Invalid username or password');
        }
      } catch (err) {
        setError('An error occurred while logging in');
      }
    } else {
      setError('Please fill in both fields');
    }
  };

  const fetchUserData = async (token: string) => {
    try {
      const res = await fetch('http://localhost:8000/auth/user/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserData(data);
      } else {
        setError('Failed to fetch user data.');
      }
    } catch (err) {
      setError('An error occurred while fetching user data.');
    }
  };

  const fetchVoiceRecords = async (token: string) => {
    try {
      const res = await fetch('http://localhost:8000/voice-records/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setVoiceRecords(data); // Зберігаємо голосові записи
      } else {
        setError('Failed to fetch voice records.');
      }
    } catch (err) {
      setError('An error occurred while fetching voice records.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setUserData(null);
    setUsername('');
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleSubmitAudio = async () => {
    if (audioFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', audioFile);

      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const res = await fetch('http://localhost:8000/voice-to-text/', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            setTranscription(data.transcription);
          } else {
            setError('Two free attempts have been used up, please purchase a subscription.');
          }
        }
      } catch (err) {
        setError('Error uploading audio');
      } finally {
        setIsUploading(false);
      }
    } else {
      setError('Please select an audio file');
    }
  };

  const handleBuyUploads = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('You need to log in to make a purchase.');
        return;
      }

      const res = await fetch('http://localhost:8000/create-checkout-session/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        setError('Failed to create checkout session.');
      }
    } catch (err) {
      setError('An error occurred while starting the checkout process.');
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      fetchUserData(storedToken);
      fetchVoiceRecords(storedToken); // Отримуємо голосові записи після завантаження сторінки
    }
  }, []);

  return (
    <Container component="main" maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Typography variant="h4" gutterBottom>
        Login Page
      </Typography>

      {userData ? (
        <Box sx={{ width: '100%' }}>
          <Typography variant="h6">User Information</Typography>
          <Typography variant="body1">
            <strong>Username:</strong> {userData.username}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {userData.email}
          </Typography>

          <Button variant="outlined" color="error" onClick={handleLogout} sx={{ marginTop: 2, width: '100%' }}>
            Logout
          </Button>

          {/* Audio Upload Section */}
          <Box sx={{ marginTop: 3 }}>
            <Typography variant="h6">Upload Audio File for Transcription</Typography>
            <input type="file" accept="audio/*" onChange={handleAudioUpload} />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitAudio}
              sx={{ marginTop: 2, width: '100%' }}
              disabled={isUploading}
            >
              {isUploading ? <CircularProgress size={24} /> : 'Submit Audio'}
            </Button>
            {transcription && (
              <Box sx={{ marginTop: 2 }}>
                <Typography variant="h6">Transcription:</Typography>
                <Typography variant="body1">{transcription}</Typography>
              </Box>
            )}
          </Box>

          {/* Voice Records List */}
          <Box sx={{ marginTop: 3 }}>
            <Typography variant="h6">Your Voice Records</Typography>
            {voiceRecords.length > 0 ? (
              <List>
                {voiceRecords.map((record) => (
                  <ListItem key={record.id}>
                    <ListItemText primary={record.title} secondary={record.created_at} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1">You don't have any voice records yet.</Typography>
            )}
          </Box>

          {/* Stripe Purchase Section */}
          <Box sx={{ marginTop: 3 }}>
            <Typography variant="h6">Buy Additional Uploads</Typography>
            <Button variant="contained" color="secondary" onClick={handleBuyUploads} sx={{ width: '100%' }}>
              Buy Now
            </Button>
          </Box>
        </Box>
      ) : (
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ marginBottom: 2 }}
            required
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ marginBottom: 2 }}
            required
          />
          <Button variant="contained" color="primary" type="submit" fullWidth sx={{ marginTop: 2 }}>
            Login
          </Button>
        </form>
      )}

      {error && <Alert severity="error" sx={{ marginTop: 2, width: '100%' }}>{error}</Alert>}
    </Container>
  );
}
