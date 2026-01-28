// Lua Loader Generator - creates downloadable .lua files with custom branding
// Inspired by ult-key-forge

import { generateAsciiArt } from './ascii-art';

export interface ThemeColors {
  r: number;
  g: number;
  b: number;
}

export interface LoaderConfig {
  scriptName: string;
  scriptId: string;
  supabaseUrl: string;
  themeColor: ThemeColors;
  showAsciiArt: boolean;
}

export function generateLoaderScript(config: LoaderConfig): string {
  const { scriptName, scriptId, supabaseUrl, themeColor, showAsciiArt } = config;
  
  const asciiArt = showAsciiArt ? generateAsciiArt(scriptName) : '';
  const asciiLines = asciiArt.split('\n').map(line => `    "${line}",`).join('\n');
  
  return `--[[
    ${scriptName} Loader
    Protected by ScriptGuard
    Generated: ${new Date().toISOString()}
]]--

local HttpService = game:GetService("HttpService")

-- Theme Configuration
local THEME = {
    Primary = Color3.fromRGB(${themeColor.r}, ${themeColor.g}, ${themeColor.b}),
    Background = Color3.fromRGB(20, 20, 30),
    Text = Color3.fromRGB(255, 255, 255),
    Secondary = Color3.fromRGB(100, 100, 120)
}

-- ASCII Art Logo
local ASCII_ART = {
${asciiLines}
}

-- Loading Animation
local function showLoadingUI()
    local ScreenGui = Instance.new("ScreenGui")
    ScreenGui.Name = "ScriptGuardLoader"
    ScreenGui.ResetOnSpawn = false
    
    local Frame = Instance.new("Frame")
    Frame.Size = UDim2.new(0, 400, 0, 300)
    Frame.Position = UDim2.new(0.5, -200, 0.5, -150)
    Frame.BackgroundColor3 = THEME.Background
    Frame.BorderSizePixel = 0
    Frame.Parent = ScreenGui
    
    local Corner = Instance.new("UICorner")
    Corner.CornerRadius = UDim.new(0, 12)
    Corner.Parent = Frame
    
    local Stroke = Instance.new("UIStroke")
    Stroke.Color = THEME.Primary
    Stroke.Thickness = 2
    Stroke.Parent = Frame
    
    -- ASCII Art Display
    local AsciiLabel = Instance.new("TextLabel")
    AsciiLabel.Size = UDim2.new(1, -20, 0, 120)
    AsciiLabel.Position = UDim2.new(0, 10, 0, 20)
    AsciiLabel.BackgroundTransparency = 1
    AsciiLabel.Font = Enum.Font.Code
    AsciiLabel.TextSize = 8
    AsciiLabel.TextColor3 = THEME.Primary
    AsciiLabel.Text = table.concat(ASCII_ART, "\\n")
    AsciiLabel.TextXAlignment = Enum.TextXAlignment.Center
    AsciiLabel.Parent = Frame
    
    -- Title
    local Title = Instance.new("TextLabel")
    Title.Size = UDim2.new(1, 0, 0, 30)
    Title.Position = UDim2.new(0, 0, 0, 150)
    Title.BackgroundTransparency = 1
    Title.Font = Enum.Font.GothamBold
    Title.TextSize = 18
    Title.TextColor3 = THEME.Text
    Title.Text = "${scriptName}"
    Title.Parent = Frame
    
    -- Status
    local Status = Instance.new("TextLabel")
    Status.Size = UDim2.new(1, 0, 0, 20)
    Status.Position = UDim2.new(0, 0, 0, 185)
    Status.BackgroundTransparency = 1
    Status.Font = Enum.Font.Gotham
    Status.TextSize = 12
    Status.TextColor3 = THEME.Secondary
    Status.Text = "Loading script..."
    Status.Parent = Frame
    
    -- Progress Bar Background
    local ProgressBg = Instance.new("Frame")
    ProgressBg.Size = UDim2.new(0.8, 0, 0, 6)
    ProgressBg.Position = UDim2.new(0.1, 0, 0, 220)
    ProgressBg.BackgroundColor3 = Color3.fromRGB(40, 40, 50)
    ProgressBg.BorderSizePixel = 0
    ProgressBg.Parent = Frame
    
    local ProgressCorner = Instance.new("UICorner")
    ProgressCorner.CornerRadius = UDim.new(1, 0)
    ProgressCorner.Parent = ProgressBg
    
    -- Progress Bar Fill
    local ProgressFill = Instance.new("Frame")
    ProgressFill.Size = UDim2.new(0, 0, 1, 0)
    ProgressFill.BackgroundColor3 = THEME.Primary
    ProgressFill.BorderSizePixel = 0
    ProgressFill.Parent = ProgressBg
    
    local ProgressFillCorner = Instance.new("UICorner")
    ProgressFillCorner.CornerRadius = UDim.new(1, 0)
    ProgressFillCorner.Parent = ProgressFill
    
    -- Credits
    local Credits = Instance.new("TextLabel")
    Credits.Size = UDim2.new(1, 0, 0, 20)
    Credits.Position = UDim2.new(0, 0, 1, -30)
    Credits.BackgroundTransparency = 1
    Credits.Font = Enum.Font.Gotham
    Credits.TextSize = 10
    Credits.TextColor3 = THEME.Secondary
    Credits.Text = "Protected by ScriptGuard"
    Credits.Parent = Frame
    
    ScreenGui.Parent = game:GetService("CoreGui")
    
    return {
        Gui = ScreenGui,
        Status = Status,
        Progress = ProgressFill
    }
end

-- Main Loader
local function loadScript()
    local UI = showLoadingUI()
    
    -- Animate progress
    spawn(function()
        for i = 1, 100 do
            UI.Progress.Size = UDim2.new(i/100, 0, 1, 0)
            wait(0.02)
        end
    end)
    
    UI.Status.Text = "Fetching script..."
    wait(0.5)
    
    local success, result = pcall(function()
        return game:HttpGet("${supabaseUrl}/functions/v1/script-loader/${scriptId}")
    end)
    
    if success then
        UI.Status.Text = "Executing..."
        wait(0.3)
        UI.Gui:Destroy()
        
        local scriptFunc, loadErr = loadstring(result)
        if scriptFunc then
            scriptFunc()
        else
            warn("[ScriptGuard] Load error:", loadErr)
        end
    else
        UI.Status.Text = "Failed to load script"
        UI.Status.TextColor3 = Color3.fromRGB(255, 100, 100)
        warn("[ScriptGuard] Fetch error:", result)
        wait(3)
        UI.Gui:Destroy()
    end
end

loadScript()
`;
}

export function downloadLuaFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.lua') ? filename : `${filename}.lua`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
