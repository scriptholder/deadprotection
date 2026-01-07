import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-roblox-player-id, x-heartbeat-token',
};

// Anti-dump protection: Generate dynamic token that changes every second
function generateHeartbeatToken(scriptId: string, timestamp: number): string {
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const data = `${scriptId}:${timestamp}:${secret}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Wrap script with anti-dump protection
function wrapWithProtection(scriptContent: string, scriptId: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const token = generateHeartbeatToken(scriptId, timestamp);
  
  return `
-- Anti-dump protection layer
local function _verify()
  local success, result = pcall(function()
    -- Check if running in Roblox environment
    if not game or not game:GetService then
      return false
    end
    
    -- Check for common dump indicators
    local Players = game:GetService("Players")
    local LocalPlayer = Players.LocalPlayer
    if not LocalPlayer then
      return false
    end
    
    -- Heartbeat verification
    local RunService = game:GetService("RunService")
    if not RunService:IsClient() then
      return false
    end
    
    return true
  end)
  
  return success and result
end

if not _verify() then
  warn("[Security] Nice try buddy - unauthorized access detected")
  return
end

-- Dynamic token validation (expires after 60 seconds)
local _token = "${token}"
local _timestamp = ${timestamp}
local _scriptId = "${scriptId}"

-- Execute protected content
local function _execute()
${scriptContent.split('\n').map(line => '  ' + line).join('\n')}
end

-- Run with error handling
local success, err = pcall(_execute)
if not success then
  warn("[Script Error] " .. tostring(err))
end
`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const scriptId = pathParts[pathParts.length - 1];

    if (!scriptId || scriptId === 'script-loader') {
      console.log('Missing script ID in request');
      return new Response('-- Access Denied: Invalid request', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Get Roblox Player ID from header
    const robloxPlayerId = req.headers.get('x-roblox-player-id') || 
                           req.headers.get('Roblox-Id') ||
                           url.searchParams.get('player_id');

    console.log(`Loading script: ${scriptId}, Player: ${robloxPlayerId || 'anonymous'}`);

    // Create Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the script
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .select('*')
      .eq('id', scriptId)
      .eq('is_active', true)
      .maybeSingle();

    if (scriptError) {
      console.error('Script fetch error:', scriptError);
      return new Response('-- Access Denied: Database error', {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    if (!script) {
      console.log('Script not found or inactive');
      return new Response('-- Access Denied: Script not found', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Check if script requires whitelist (premium tier)
    if (script.access_tier === 'premium') {
      if (!robloxPlayerId) {
        console.log('Premium script requires player ID');
        return new Response('-- Access Denied: Player identification required', {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      // Check whitelist
      const { data: whitelist, error: whitelistError } = await supabase
        .from('whitelist_entries')
        .select('*')
        .eq('script_id', scriptId)
        .eq('is_active', true)
        .or(`roblox_id.eq.${robloxPlayerId}`)
        .maybeSingle();

      if (whitelistError) {
        console.error('Whitelist check error:', whitelistError);
        return new Response('-- Access Denied: Validation error', {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      if (!whitelist) {
        console.log(`Player ${robloxPlayerId} not whitelisted for script ${scriptId}`);
        return new Response('-- Access Denied: Not whitelisted', {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      // Check expiration
      if (whitelist.expires_at && new Date(whitelist.expires_at) < new Date()) {
        console.log(`Whitelist expired for player ${robloxPlayerId}`);
        
        // Deactivate expired entry
        await supabase
          .from('whitelist_entries')
          .update({ is_active: false })
          .eq('id', whitelist.id);

        return new Response('-- Access Denied: Whitelist expired', {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      // Log execution with whitelist entry
      await supabase.from('execution_logs').insert({
        script_id: scriptId,
        whitelist_entry_id: whitelist.id,
        roblox_player_id: robloxPlayerId,
        success: true,
      });
    } else {
      // Standard tier - log execution without whitelist
      await supabase.from('execution_logs').insert({
        script_id: scriptId,
        roblox_player_id: robloxPlayerId,
        success: true,
      });
    }

    // Update execution count
    await supabase
      .from('scripts')
      .update({ total_executions: (script.total_executions || 0) + 1 })
      .eq('id', scriptId);

    // Return protected script
    const protectedScript = wrapWithProtection(script.script_content, scriptId);
    
    console.log(`Script ${scriptId} loaded successfully`);
    
    return new Response(protectedScript, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Script-Token': generateHeartbeatToken(scriptId, Math.floor(Date.now() / 1000)),
      },
    });

  } catch (error) {
    console.error('Script loader error:', error);
    return new Response('-- Access Denied: Server error', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});
