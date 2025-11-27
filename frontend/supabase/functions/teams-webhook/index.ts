import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TeamsWebhookPayload {
  type: 'new_referral' | 'f2f_deadline' | 'status_change';
  referral_id: string;
  data?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { type, referral_id, data } = await req.json() as TeamsWebhookPayload

    // Validate the request
    if (!type || !referral_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, referral_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get referral data
    const { data: referral, error: referralError } = await supabaseClient
      .from('referrals')
      .select(`
        *,
        organizations (name, type)
      `)
      .eq('id', referral_id)
      .single()

    if (referralError || !referral) {
      return new Response(
        JSON.stringify({ error: 'Referral not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process the webhook based on type
    let notificationPayload: any = {}
    
    switch (type) {
      case 'new_referral':
        notificationPayload = buildNewReferralPayload(referral, data)
        break
      case 'f2f_deadline':
        notificationPayload = buildF2FDeadlinePayload(referral, data)
        break
      case 'status_change':
        notificationPayload = buildStatusChangePayload(referral, data)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown webhook type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Send to Teams webhook
    const teamsWebhookUrl = Deno.env.get('TEAMS_WEBHOOK_URL')
    if (!teamsWebhookUrl) {
      console.error('Teams webhook URL not configured')
      return new Response(
        JSON.stringify({ error: 'Teams webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const teamsResponse = await fetch(teamsWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationPayload),
    })

    if (!teamsResponse.ok) {
      throw new Error(`Teams webhook failed: ${teamsResponse.statusText}`)
    }

    // Log the notification
    await supabaseClient
      .from('teams_notifications')
      .insert({
        notification_type: type,
        referral_id: referral_id,
        status: 'sent',
        payload: notificationPayload,
        sent_at: new Date().toISOString(),
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Teams webhook error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildNewReferralPayload(referral: any, data: any) {
  const priorityColor = {
    urgent: '#FF4B4B',
    routine: '#4A90E2',
    low: '#7ED321'
  }

  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": priorityColor[referral.priority] || '#4A90E2',
    "summary": `New ${referral.priority} priority referral`,
    "sections": [
      {
        "activityTitle": "🏥 New Hospice Referral Received",
        "activitySubtitle": `New referral for ${referral.patient_name}`,
        "activityImage": "https://teamsnodesample.azurewebsites.net/static/img/image5.png",
        "facts": [
          {
            "name": "Patient Name",
            "value": referral.patient_name
          },
          {
            "name": "Priority",
            "value": referral.priority?.toUpperCase() || 'ROUTINE'
          },
          {
            "name": "Status",
            "value": formatStatus(referral.status)
          },
          {
            "name": "Organization",
            "value": referral.organizations?.name || 'Unknown'
          },
          {
            "name": "Assigned Marketer",
            "value": referral.assigned_marketer || 'Unassigned'
          },
          ...(referral.diagnosis ? [{
            "name": "Diagnosis",
            "value": referral.diagnosis
          }] : []),
          ...(referral.insurance ? [{
            "name": "Insurance",
            "value": referral.insurance
          }] : [])
        ]
      },
      ...(referral.notes ? [{
        "activityTitle": "Notes",
        "text": referral.notes
      }] : [])
    ],
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "View Referral Details",
        "targets": [
          {
            "os": "default",
            "uri": `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/referrals/${referral.id}`
          }
        ]
      }
    ]
  }
}

function buildF2FDeadlinePayload(referral: any, data: any) {
  const daysUntilDeadline = data?.daysUntilDeadline || 0
  const isOverdue = daysUntilDeadline < 0
  const urgencyColor = isOverdue ? '#FF4B4B' : daysUntilDeadline <= 3 ? '#FF8C00' : '#FFD700'
  
  const deadlineText = isOverdue 
    ? `${Math.abs(daysUntilDeadline)} days overdue`
    : daysUntilDeadline === 0 
      ? 'DUE TODAY'
      : `${daysUntilDeadline} days remaining`

  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": urgencyColor,
    "summary": `F2F deadline ${deadlineText}`,
    "sections": [
      {
        "activityTitle": isOverdue ? "🚨 F2F Visit OVERDUE" : "⏰ F2F Visit Deadline Alert",
        "activitySubtitle": `F2F visit required for ${referral.patient_name}`,
        "facts": [
          {
            "name": "Patient",
            "value": referral.patient_name
          },
          {
            "name": "Status",
            "value": deadlineText
          },
          {
            "name": "Assigned Marketer",
            "value": referral.assigned_marketer || 'Unassigned'
          },
          {
            "name": "Organization",
            "value": referral.organizations?.name || 'Unknown'
          }
        ]
      }
    ],
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "Schedule F2F Visit",
        "targets": [
          {
            "os": "default",
            "uri": `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/referrals/${referral.id}?action=schedule-f2f`
          }
        ]
      }
    ]
  }
}

function buildStatusChangePayload(referral: any, data: any) {
  const oldStatus = data?.oldStatus || 'unknown'
  const newStatus = referral.status

  const statusColors = {
    admitted: '#7ED321',
    not_admitted_patient_choice: '#FF4B4B',
    not_admitted_not_appropriate: '#FF8C00',
    assessment_scheduled: '#4A90E2',
    pending_admission: '#50E3C2'
  }

  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": statusColors[newStatus as keyof typeof statusColors] || '#4A90E2',
    "summary": `Status: ${formatStatus(oldStatus)} → ${formatStatus(newStatus)}`,
    "sections": [
      {
        "activityTitle": "📋 Referral Status Update",
        "activitySubtitle": `Status changed for ${referral.patient_name}`,
        "facts": [
          {
            "name": "Patient",
            "value": referral.patient_name
          },
          {
            "name": "Previous Status",
            "value": formatStatus(oldStatus)
          },
          {
            "name": "New Status",
            "value": formatStatus(newStatus)
          },
          {
            "name": "Organization",
            "value": referral.organizations?.name || 'Unknown'
          },
          {
            "name": "Assigned Marketer",
            "value": referral.assigned_marketer || 'Unassigned'
          }
        ]
      },
      ...(referral.reason_for_non_admittance && newStatus.includes('not_admitted') ? [{
        "activityTitle": "Additional Information",
        "facts": [{
          "name": "Reason",
          "value": referral.reason_for_non_admittance
        }]
      }] : [])
    ],
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "View Referral",
        "targets": [
          {
            "os": "default",
            "uri": `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/referrals/${referral.id}`
          }
        ]
      }
    ]
  }
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}