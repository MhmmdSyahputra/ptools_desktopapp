import { useEffect, useMemo, useState } from 'react'
import { Box, Card, CardContent, Stack, Typography, alpha } from '@mui/material'
import { AccessTimeRounded, CalendarMonthRounded, WavingHandRounded } from '@mui/icons-material'

export const HomePage = () => {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const timeText = useMemo(
    () =>
      now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
    [now]
  )

  const dateText = useMemo(
    () =>
      now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }),
    [now]
  )

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        bgcolor: '#0f1117',
        backgroundImage: `radial-gradient(ellipse at 15% 15%, ${alpha('#1a73e8', 0.08)} 0%, transparent 50%), radial-gradient(ellipse at 85% 85%, ${alpha('#00c853', 0.06)} 0%, transparent 50%)`,
        px: { xs: 2, sm: 3.5, md: 4 },
        pt: { xs: 2, sm: 3, md: 3 },
        pb: 4,
        fontFamily: '"IBM Plex Mono", monospace',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#ffffff', 0.1), borderRadius: 2 }
      }}
    >
      <Box maxWidth={1200} mx="auto">
        <Card
          sx={{
            bgcolor: alpha('#1e2130', 0.9),
            border: `1px solid ${alpha('#3d4263', 0.6)}`,
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Stack direction="row" alignItems="center" gap={1.2} mb={0.8}>
              <WavingHandRounded sx={{ color: '#ffca28', fontSize: 22 }} />
              <Typography
                sx={{
                  color: '#e8eaf6',
                  fontWeight: 700,
                  fontSize: { xs: 18, sm: 21 },
                  letterSpacing: '-0.4px'
                }}
              >
                Selamat datang di PTools
              </Typography>
            </Stack>

            <Typography
              sx={{
                color: alpha('#e8eaf6', 0.55),
                mb: 3,
                fontSize: 12,
                maxWidth: 720,
                lineHeight: 1.7
              }}
            >
              Gunakan sidebar untuk membuka Messenger atau Project Cleaner. Halaman ini sekarang
              menjadi dashboard utama dengan informasi waktu saat ini.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
              <Card
                sx={{
                  flex: 1,
                  bgcolor: alpha('#0f1117', 0.75),
                  border: `1px solid ${alpha('#1a73e8', 0.3)}`,
                  borderRadius: 2.5
                }}
              >
                <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" alignItems="center" gap={1} mb={0.8}>
                    <AccessTimeRounded sx={{ color: '#1a73e8', fontSize: 17 }} />
                    <Typography sx={{ color: alpha('#e8eaf6', 0.4), fontSize: 11 }}>
                      Waktu sekarang
                    </Typography>
                  </Stack>
                  <Typography sx={{ color: '#e8eaf6', fontSize: 28, fontWeight: 700 }}>
                    {timeText}
                  </Typography>
                </CardContent>
              </Card>

              <Card
                sx={{
                  flex: 1,
                  bgcolor: alpha('#0f1117', 0.75),
                  border: `1px solid ${alpha('#00c853', 0.3)}`,
                  borderRadius: 2.5
                }}
              >
                <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" alignItems="center" gap={1} mb={0.8}>
                    <CalendarMonthRounded sx={{ color: '#00c853', fontSize: 17 }} />
                    <Typography sx={{ color: alpha('#e8eaf6', 0.4), fontSize: 11 }}>
                      Tanggal hari ini
                    </Typography>
                  </Stack>
                  <Typography sx={{ color: '#e8eaf6', fontSize: 15, fontWeight: 600 }}>
                    {dateText}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}