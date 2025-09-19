# UI Design System & Component Architecture

## Design System Foundation

### Color Palette
```
Primary Colors:
- Primary Blue: #0066FF (buttons, links, active states)
- Primary Dark: #0052CC (hover states, depth)
- Primary Light: #4D94FF (disabled states, highlights)

Secondary Colors:
- Success Green: #00B84A (success states, online indicators) 
- Warning Orange: #FF8800 (warnings, attention states)
- Error Red: #FF4757 (errors, destructive actions)
- Info Purple: #7C3AED (information, presenter badge)

Neutral Palette:
- Background: #FFFFFF (main background)
- Surface: #F8FAFC (cards, elevated surfaces)
- Border: #E2E8F0 (dividers, input borders)
- Text Primary: #1E293B (headings, primary text)
- Text Secondary: #64748B (secondary text, labels)
- Text Muted: #94A3B8 (captions, hints)
- Overlay: rgba(0, 0, 0, 0.5) (modal backgrounds)
```

### Typography Scale
```
Font Family: 
- Primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
- Monospace: 'JetBrains Mono', 'Monaco', monospace

Typography Scale:
- Headline 1: 48px, font-weight: 700, line-height: 1.2 (page titles)
- Headline 2: 36px, font-weight: 600, line-height: 1.3 (section titles)  
- Headline 3: 24px, font-weight: 600, line-height: 1.4 (card titles)
- Headline 4: 20px, font-weight: 500, line-height: 1.4 (component titles)
- Body Large: 18px, font-weight: 400, line-height: 1.6 (hero text)
- Body: 16px, font-weight: 400, line-height: 1.5 (default text)
- Body Small: 14px, font-weight: 400, line-height: 1.4 (captions, labels)
- Caption: 12px, font-weight: 400, line-height: 1.3 (timestamps, metadata)
```

### Spacing System (8px Grid)
```
Spacing Scale:
- xs: 4px (tight spacing)
- sm: 8px (small spacing)
- md: 16px (default spacing)  
- lg: 24px (section spacing)
- xl: 32px (large spacing)
- 2xl: 48px (page spacing)
- 3xl: 64px (hero spacing)
```

### Border Radius & Shadows
```
Border Radius:
- sm: 4px (buttons, inputs)
- md: 8px (cards, panels)
- lg: 12px (modals, large components)
- xl: 16px (hero elements)
- full: 50% (avatars, circular buttons)

Shadow System:
- sm: 0 1px 2px rgba(0, 0, 0, 0.05) (subtle elevation)
- md: 0 4px 6px rgba(0, 0, 0, 0.07) (cards, buttons)
- lg: 0 10px 15px rgba(0, 0, 0, 0.1) (modals, dropdowns)
- xl: 0 25px 50px rgba(0, 0, 0, 0.25) (hero elements)
```

## Component Library Architecture

### Base Components (shadcn/ui inspired)

#### Button Variants
```
Primary Button:
[    Start Presentation    ] - bg-blue-600, text-white, hover:bg-blue-700

Secondary Button:  
[     Join Room     ] - bg-gray-100, text-gray-900, hover:bg-gray-200

Outline Button:
[    Screen Share    ] - border-gray-300, text-gray-700, hover:border-blue-500

Danger Button:
[    End Session    ] - bg-red-600, text-white, hover:bg-red-700

Icon Button:
[ 🎤 ] - Square, minimal, for quick actions
```

#### Input Components
```
Text Input:
┌─────────────────────────────────┐
│ Your Name                       │ <- Placeholder
└─────────────────────────────────┘

Text Input (Focused):
┌─────────────────────────────────┐
│ John Smith                      │ <- User input
└─────────────────────────────────┘
  ^ Blue border when focused

Select Dropdown:
┌─────────────────────────────────┐
│ Select Camera            ▼      │
└─────────────────────────────────┘
```

### Advanced Components (Aceternity UI style)

#### Video Call Interface
```
┌───────────────────────────────────────────────────────┐
│                                                       │
│         [Presenter Video Stream]                      │
│                                                       │
│                                                       │
│  ┌─ John Smith (Presenter) ─────────────────────┐     │
│  │                                              │     │
│  │           Live Video Feed                    │     │
│  │                                              │     │
│  └──────────────────────────────────────────────┘     │
│                                                       │
│  Controls: [🎤] [📹] [🖥️] [❌]                         │
│                                                       │
└───────────────────────────────────────────────────────┘
```

#### Chat Interface
```
Chat Panel:
┌─ Live Chat ──────────────────────────┐
│                                      │
│ Alice: Great presentation! 👏        │
│ Bob: Can you share the slides?       │
│ Carol: Question about slide 3       │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Type your message...             │ │  
│ └──────────────────────────────────┘ │
│                               [Send] │
└──────────────────────────────────────┘
```

#### Q&A System
```
Q&A Panel:
┌─ Questions & Answers ────────────────┐
│                                      │
│ ┌─ Question 1 ────────────── ⬆ 5 ─┐ │
│ │ "How do you handle errors?"      │ │
│ │ - Anonymous                      │ │
│ │ [Answer] [Pin] [Delete]          │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌─ Question 2 ────────────── ⬆ 2 ─┐ │
│ │ "What about performance?"        │ │
│ │ - Sarah M.                       │ │
│ │ [Answer] [Pin] [Delete]          │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [+ Ask Question]                     │
└──────────────────────────────────────┘
```

### Participant List
```
Participants (12):
┌──────────────────────────────────────┐
│ 👤 John Smith (Presenter) [Host]     │
│ 👤 Alice Johnson [🎤] [📹]           │  
│ 👤 Bob Wilson [🎤] [🔇]              │
│ 👤 Carol Davis [🔇] [📹]             │
│ 👤 Anonymous (5 users)               │
│                                      │
│ [Mute All] [Video Off All]           │
└──────────────────────────────────────┘
```

## Page Layouts & Wireframes

### Homepage Layout
```
┌─────────────────────────────────────────────────────────┐
│                    ConferenceHub                        │
│                                                         │
│         Professional Video Conferencing Made Simple    │
│                                                         │
│   [Host a Presentation]        [Join Presentation]     │
│                                                         │
│   ✓ No downloads required      ✓ Anonymous joining     │
│   ✓ Screen sharing             ✓ Real-time Q&A         │ 
│   ✓ Up to 50 participants     ✓ Mobile friendly        │
│                                                         │
│   Recent Rooms:                                         │
│   • Marketing Kickoff (Yesterday)                       │
│   • Product Demo (Last week)                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Room Creation Page
```
┌─── Create Presentation Room ───────────────────────────┐
│                                                        │
│ Room Details:                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Presentation Title                                 │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Your Name (as presenter)                           │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ Room Settings:                                         │
│ □ Require password to join                             │
│ □ Allow anonymous questions                            │
│ □ Enable waiting room                                  │
│                                                        │
│ [Create Room] [Cancel]                                 │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Presenter Dashboard (Full Layout)
```
┌─── Marketing Kickoff - Presenter View ─────────────────┐
│                                                        │
│ ┌─ Video Stream ─────────┐  ┌─ Participants (8) ────┐ │
│ │                        │  │ 👤 John (You) [Host]  │ │
│ │    [Your Video]        │  │ 👤 Alice [🎤] [📹]    │ │
│ │                        │  │ 👤 Bob [🎤] [🔇]      │ │
│ │                        │  │ 👤 Carol [🔇] [📹]    │ │
│ │ [🎤] [📹] [🖥️] [❌]    │  │ + 4 more...           │ │
│ └────────────────────────┘  │                       │ │
│                             │ [Mute All]            │ │
│ ┌─ Room Controls ────────────┐ └─────────────────────┘ │
│ │ 📋 Room: room.co/abc123  │                         │
│ │ [Copy Link] [Settings]   │  ┌─ Q&A (3 questions) ─┐ │
│ └──────────────────────────┘  │ ❓ How to join?     │ │
│                               │ ⬆ 2 votes           │ │
│ ┌─ Live Chat ──────────────┐  │ [Answer]            │ │
│ │ Alice: Great stuff! 👏   │  │                     │ │
│ │ Bob: Can you share link? │  │ ❓ Next steps?      │ │
│ │ Carol: Thanks for demo   │  │ ⬆ 1 vote           │ │
│ │ ┌──────────────────────┐ │  │ [Answer]            │ │
│ │ │ Type message...      │ │  └─────────────────────┘ │
│ │ └──────────────────────┘ │                         │
│ └──────────────────────────┘                         │
└────────────────────────────────────────────────────────┘
```

### Attendee View (Simplified)
```
┌─── Marketing Kickoff ──────────────────────────────────┐
│                                                        │
│ ┌─ John Smith (Presenter) ───────────────────────────┐ │
│ │                                                    │ │
│ │              [Presenter Video]                     │ │  
│ │                                                    │ │
│ │ Currently sharing screen: "Q4 Results.pptx"       │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [🎤] [🔇] [👋] [❓Ask Question] [💬 Chat] [🚪 Leave]  │
│                                                        │
│ ┌─ Chat & Q&A ─────────────────┐ 12 participants      │
│ │ 💬 Alice: Great presentation!│ Online now            │
│ │ ❓ You: How to get slides?   │                       │
│ │ 💬 Bob: +1 on that question │                       │
│ │ ┌─────────────────────────┐  │                       │
│ │ │ Ask a question...       │  │                       │
│ │ └─────────────────────────┘  │                       │
│ └──────────────────────────────┘                       │
└────────────────────────────────────────────────────────┘
```

## Interaction Design & Animations

### Framer Motion Concepts

#### Page Transitions
```javascript
// Smooth slide-in effect for room joining
const slideInVariants = {
  hidden: { x: 100, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.5 } }
}

// Gentle bounce for button interactions  
const bounceVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
}
```

#### Micro-interactions
- **Button hover**: Gentle lift with shadow increase
- **Video mute**: Smooth cross-fade to muted state
- **Chat messages**: Slide in from bottom
- **Participant join**: Fade in with subtle bounce
- **Question submission**: Slide up with success state
- **Screen share**: Smooth transition to full screen

#### Loading States
- **Room joining**: Spinner with connection status
- **Video loading**: Skeleton placeholder with pulse
- **File upload**: Progress bar with percentage
- **Chat loading**: Message placeholders

### Accessibility Features

#### Keyboard Navigation
- **Tab order**: Logical flow through all interactive elements
- **Focus indicators**: Clear blue outline on all focusable items
- **Skip links**: "Skip to main content" for screen readers
- **Shortcuts**: Alt+M (mute), Alt+V (video), Alt+S (share screen)

#### Screen Reader Support
- **ARIA labels**: All buttons and inputs properly labeled
- **Live regions**: Chat messages and notifications announced
- **Status updates**: Connection status, participant changes
- **Form validation**: Clear error messages

#### High Contrast Mode
- **Text contrast**: Minimum 4.5:1 ratio for normal text
- **Interactive elements**: Clear distinction from background
- **Status indicators**: Color + icon combinations
- **Focus states**: High contrast outlines

## Component Priority Matrix

### Essential (Launch MVP)
1. Video/Audio components
2. Basic chat interface  
3. Room creation/join flows
4. Screen sharing controls
5. Participant list

### Important (Phase 2)
1. Q&A system
2. Reaction system  
3. Advanced participant controls
4. Mobile optimization
5. Accessibility features

### Nice-to-have (Phase 3)
1. Virtual backgrounds
2. Recording interface
3. Breakout rooms UI
4. Advanced animations
5. Custom branding options
