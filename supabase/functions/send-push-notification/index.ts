import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireAdmin } from '../_shared/admin-auth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

interface PushPayload {
  title: string
  body: string
  url?: string
  notificationType: 'order_update' | 'promo'
  userId?: string
  orderId?: string
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Only admins (or a server call with the service role key) may send.
    // Before, any Authorization header at all was accepted.
    const authHeader = req.headers.get('Authorization') || ''
    const isServiceCall = authHeader === `Bearer ${supabaseServiceKey}`
    if (!isServiceCall) {
      const denied = await requireAdmin(req, corsHeaders)
      if (denied) return denied
    }

    const payload: PushPayload = await req.json()
    const { title, body, url, notificationType, userId, orderId } = payload

    // Build query for subscriptions
    let query = supabase.from('push_subscriptions').select('*')

    // Filter by notification type preference
    if (notificationType === 'order_update') {
      query = query.eq('order_updates', true)
      if (userId) {
        query = query.eq('user_id', userId)
      }
    } else if (notificationType === 'promo') {
      query = query.eq('promo_alerts', true)
    }

    const { data: subscriptions, error: subError } = await query

    if (subError) {
      throw subError
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Note: In production, you would use web-push library with VAPID keys
    // This is a placeholder that logs the notification data
    // To implement real push, you need:
    // 1. Generate VAPID keys (npx web-push generate-vapid-keys)
    // 2. Store them as secrets
    // 3. Use web-push library to send

    const notificationPayload = {
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      url: url || '/',
      tag: orderId ? `order-${orderId}` : 'krt-promo',
    }

    // Log for now - in production, send real push notifications
    console.log(`Would send ${subscriptions.length} push notifications:`, notificationPayload)

    // Record in notification queue
    await supabase.from('notification_queue').insert({
      title,
      body,
      url,
      notification_type: notificationType,
      target_users: userId ? [userId] : null,
      sent_at: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({ 
        message: 'Notifications queued', 
        sent: subscriptions.length,
        payload: notificationPayload 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Push notification error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
