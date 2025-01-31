import { format } from 'date-fns'
import nodemailer from 'nodemailer'

interface SessionDetails {
  startTime: string
  endTime: string
  durationMinutes: number
  schedulingUrl: string
  rate: number
  currency: string
  coach: {
    firstName: string
    lastName: string
    email: string
  }
  mentee: {
    firstName: string
    lastName: string
    email: string
  }
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendSessionConfirmationEmails(session: SessionDetails) {
  const startTime = new Date(session.startTime)
  const endTime = new Date(session.endTime)

  // Send email to mentee
  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: session.mentee.email,
    subject: `Coaching Session Scheduled with ${session.coach.firstName}`,
    html: `
      <h2>Your Coaching Session is Scheduled!</h2>
      <p>Hello ${session.mentee.firstName},</p>
      <p>Your coaching session with ${session.coach.firstName} ${session.coach.lastName} has been scheduled.</p>
      
      <h3>Session Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${format(startTime, 'EEEE, MMMM d, yyyy')}</li>
        <li><strong>Time:</strong> ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}</li>
        <li><strong>Duration:</strong> ${session.durationMinutes} minutes</li>
        <li><strong>Rate:</strong> ${session.currency} ${session.rate}</li>
      </ul>

      <p>Please complete your scheduling by clicking the link below:</p>
      <p><a href="${session.schedulingUrl}">Complete Scheduling</a></p>

      <p>Once you complete the scheduling, you'll receive a calendar invitation with the meeting details.</p>

      <p>If you need to reschedule or cancel your session, you can do so from your dashboard.</p>

      <p>Best regards,<br>The Team</p>
    `,
  })

  // Send email to coach
  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: session.coach.email,
    subject: `New Coaching Session Scheduled with ${session.mentee.firstName}`,
    html: `
      <h2>New Coaching Session Scheduled</h2>
      <p>Hello ${session.coach.firstName},</p>
      <p>A new coaching session has been scheduled with ${session.mentee.firstName} ${session.mentee.lastName}.</p>
      
      <h3>Session Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${format(startTime, 'EEEE, MMMM d, yyyy')}</li>
        <li><strong>Time:</strong> ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}</li>
        <li><strong>Duration:</strong> ${session.durationMinutes} minutes</li>
        <li><strong>Rate:</strong> ${session.currency} ${session.rate}</li>
        <li><strong>Mentee Email:</strong> ${session.mentee.email}</li>
      </ul>

      <p>The mentee will complete their scheduling through Calendly, and you'll receive a calendar invitation once they do.</p>

      <p>Best regards,<br>The Team</p>
    `,
  })
} 