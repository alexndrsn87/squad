import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = 'Squad <noreply@yourdomain.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Email templates ──────────────────────────────────────────────────────────

export async function sendPollOpenEmail({
  to,
  name,
  teamName,
  gameDate,
  gameId,
}: {
  to: string
  name: string
  teamName: string
  gameDate: string
  gameId: string
}) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `⚽ ${teamName} – are you in for ${gameDate}?`,
    html: emailHtml({
      title: `Are you playing on ${gameDate}?`,
      body: `Hi ${name},<br><br>
        The availability poll for <strong>${teamName}</strong> is now open.<br>
        Let your organiser know if you're in, out, or maybe.`,
      cta: { text: 'Respond now', url: `${APP_URL}/games/${gameId}` },
    }),
  })
}

export async function sendTeamsPickedEmail({
  to,
  name,
  teamName,
  gameDate,
  gameId,
}: {
  to: string
  name: string
  teamName: string
  gameDate: string
  gameId: string
}) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `🎯 ${teamName} – teams are out for ${gameDate}`,
    html: emailHtml({
      title: 'Teams have been picked!',
      body: `Hi ${name},<br><br>
        The teams for <strong>${teamName}</strong> on ${gameDate} have been selected.<br>
        Check who you're playing with and settle up if there's a payment.`,
      cta: { text: 'View teams', url: `${APP_URL}/games/${gameId}` },
    }),
  })
}

export async function sendGameReminderEmail({
  to,
  name,
  teamName,
  gameDate,
  gameId,
}: {
  to: string
  name: string
  teamName: string
  gameDate: string
  gameId: string
}) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `⏰ Reminder – ${teamName} is tomorrow`,
    html: emailHtml({
      title: `Reminder: game tomorrow`,
      body: `Hi ${name},<br><br>
        Just a reminder — <strong>${teamName}</strong> is on ${gameDate}.<br>
        Make sure you've responded to the availability poll!`,
      cta: { text: 'View game', url: `${APP_URL}/games/${gameId}` },
    }),
  })
}

export async function sendRatingRequestEmail({
  to,
  name,
  teamName,
  gameDate,
  gameId,
}: {
  to: string
  name: string
  teamName: string
  gameDate: string
  gameId: string
}) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `⭐ Rate your teammates – ${teamName} ${gameDate}`,
    html: emailHtml({
      title: 'Rate your teammates',
      body: `Hi ${name},<br><br>
        How did everyone do in the <strong>${teamName}</strong> game on ${gameDate}?<br>
        Ratings are anonymous and help balance future teams.`,
      cta: { text: 'Rate now', url: `${APP_URL}/games/${gameId}` },
    }),
  })
}

export async function sendInviteEmail({
  to,
  inviterName,
  teamName,
  inviteCode,
}: {
  to: string
  inviterName: string
  teamName: string
  inviteCode: string
}) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${inviterName} invited you to join ${teamName} on Squad`,
    html: emailHtml({
      title: `You've been invited!`,
      body: `<strong>${inviterName}</strong> has invited you to join <strong>${teamName}</strong> on Squad.<br><br>
        Squad helps football teams manage games, availability, payments, and team selection.`,
      cta: { text: 'Join the team', url: `${APP_URL}/teams/join/${inviteCode}` },
    }),
  })
}

// ─── Helper: base HTML template ──────────────────────────────────────────────

function emailHtml({
  title,
  body,
  cta,
}: {
  title: string
  body: string
  cta: { text: string; url: string }
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: #07070F; font-family: 'Inter', Arial, sans-serif; color: #E8E8F0; }
    .container { max-width: 520px; margin: 0 auto; padding: 40px 24px; }
    .logo { font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #B8FF3C; margin-bottom: 32px; }
    .title { font-size: 22px; font-weight: 700; margin-bottom: 16px; }
    .body { font-size: 15px; line-height: 1.6; color: #9898B0; margin-bottom: 28px; }
    .cta { display: inline-block; background: #B8FF3C; color: #07070F; font-weight: 700; font-size: 15px;
           padding: 14px 28px; border-radius: 12px; text-decoration: none; }
    .footer { margin-top: 48px; font-size: 12px; color: #5A5A70; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">SQUAD</div>
    <div class="title">${title}</div>
    <div class="body">${body}</div>
    <a href="${cta.url}" class="cta">${cta.text}</a>
    <div class="footer">
      You're receiving this because you're a member of a Squad team.<br>
      <a href="${APP_URL}" style="color: #5A5A70;">squad.app</a>
    </div>
  </div>
</body>
</html>`
}
