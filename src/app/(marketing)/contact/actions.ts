'use server'

import { contactFormSchema, type ContactFormData } from '@/lib/validations'

export async function submitContactForm(data: ContactFormData) {
  try {
    // Validate the data
    const validatedData = contactFormSchema.parse(data)

    // Check for API key
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not defined')
      return {
        success: false,
        message: 'Email service is not configured. Please try again later.',
      }
    }

    // Initialize Resend
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev'
    const emailTo = process.env.EMAIL_TO || 'carlo@example.com' // Fallback for safety

    // Send the email
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: emailTo,
      subject: `New Contact Form Submission: ${validatedData.name}`,
      text: `
Name: ${validatedData.name}
Email: ${validatedData.email}
Message:
${validatedData.message}
      `,
      // HTML version
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${validatedData.name}</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Message:</strong></p>
        <p>${validatedData.message.replace(/\n/g, '<br>')}</p>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return {
        success: false,
        message: 'Failed to send message. Please try again.',
      }
    }

    // Return success
    return {
      success: true,
      message: 'Thank you for your message! I will get back to you soon.',
    }
  } catch (error) {
    console.error('Contact form error:', error)
    return {
      success: false,
      message: 'Something went wrong. Please try again later.',
    }
  }
}
