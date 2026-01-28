# 📬 Notification System - User Guide

## What's New? 🎉

Your messaging system now has **professional-grade notifications** just like Slack, WhatsApp, and Microsoft Teams!

---

## 🔔 Notification Features

### 1. **Visual Badges** (Always On)
Where you'll see them:
- **📍 Sidebar "Messages" item**: Shows total unread count with animated badge
- **📍 Top-right bell icon**: Quick glance at unread messages
- **📍 Small dots**: Pulsing indicators on icons

**What they look like:**
- 🔴 Red gradient badge with glow effect
- ⭕ Pulsing ring animation for attention
- 🔢 Number shows count (up to 99+)
- ✨ Smooth animations when count changes

**Example:**
```
0 unread: No badge
1-9 unread: Shows "3"
10-99 unread: Shows "24"
100+ unread: Shows "99+"
```

---

### 2. **Browser Tab Title** 📑 (Always On)
Your browser tab title updates with unread count!

**Example:**
```
No messages: "Veteran Hub"
3 new messages: "(3) Veteran Hub"
```

**Why it's useful:**
- See unread count when tab is in background
- Know when new messages arrive even when working elsewhere
- No need to switch tabs to check

---

### 3. **Sound Alerts** 🔊 (Can be turned off)
Get an audio notification when new messages arrive.

**Details:**
- 🎵 Subtle beep sound (not annoying!)
- 🔉 Low volume (30%)
- ⚙️ Can be disabled in settings
- 🌐 Works on all modern browsers

**When it plays:**
- Only when NEW messages arrive (not on page load)
- Only if you haven't disabled it in settings

---

### 4. **Desktop Notifications** 💻 (Can be turned off)
Get popup notifications on your desktop/laptop!

**Details:**
- 📬 Shows "New Message" with unread count
- ⏱️ Auto-closes after 4 seconds
- 🖱️ Click to go directly to messages
- 🔒 Requires your permission (one-time)
- ⚙️ Can be disabled in settings

**Example Notification:**
```
┌─────────────────────────────┐
│ 🔔 New Message              │
│ You have 2 unread messages  │
└─────────────────────────────┘
```

**Privacy Note:**
- Only shows count, NOT message content
- Only works when you grant browser permission

---

## ⚙️ Managing Your Notifications

### How to Access Settings
1. Look at the **left sidebar** (dashboard)
2. Scroll to the **bottom**
3. Click the **"Notifications"** button (above Logout)
4. Settings modal opens

### Available Settings

#### 🔊 Sound Alerts
**Toggle:** ON/OFF  
**What it does:** Play sound when new message arrives  
**Default:** ON

**When to turn OFF:**
- Working in a quiet environment
- Don't want audio distractions
- Using screen reader that announces changes

#### 💻 Desktop Notifications
**Toggle:** ON/OFF  
**What it does:** Show popup notification on desktop  
**Default:** ON (if you grant permission)

**When to turn OFF:**
- Too many distractions
- Don't want popups
- Using a shared computer

**Permission States:**
- ✅ **Granted**: Notifications work when enabled
- ⏳ **Not decided**: Will ask when you turn ON
- ❌ **Blocked**: Disabled by browser settings

---

## 🎯 How It Works - Step by Step

### Scenario 1: You're on the Dashboard
1. Someone sends you a message
2. Within **10 seconds**, you'll see:
   - ✨ Badge appears on "Messages" in sidebar
   - 📬 Bell icon shows count in top bar
   - 📑 Browser tab title updates: "(1) Veteran Hub"
   - 🔊 Sound plays (if enabled)
   - 💻 Desktop notification appears (if enabled)

3. You click "Messages" in sidebar
4. You read the message
5. All badges disappear automatically

### Scenario 2: You're on Another Page (Feed, Events, etc.)
1. Someone sends you a message
2. You'll see:
   - ✨ Badge appears on "Messages" in sidebar
   - 📬 Bell icon shows count in top bar
   - 📑 Browser tab title: "(1) Veteran Hub"
   - 🔊 Sound plays (if enabled)
   - 💻 Desktop notification pops up (if enabled)
   - 🎯 Small toast notification appears (if viewing messages from another room)

3. You can:
   - **Click the badge** in sidebar → Go to messages
   - **Click the bell icon** → Go to messages
   - **Click desktop notification** → Go to messages
   - **Continue what you're doing** → Check later

### Scenario 3: Browser Tab is in Background
1. Someone sends you a message
2. You'll see/hear:
   - 📑 Tab title updates (you can see it in tab list)
   - 🔊 Sound plays (if enabled and browser allows)
   - 💻 Desktop notification appears (if enabled)

3. You switch back to the tab
4. Badges are visible immediately

---

## 🔧 Troubleshooting

### "I don't hear any sound"
**Possible causes:**
1. Sound is disabled in settings
   - **Fix:** Click "Notifications" in sidebar → Turn ON sound
2. Browser has muted the site
   - **Fix:** Check browser address bar for mute icon
3. System sound is off/low
   - **Fix:** Check system volume settings

### "Desktop notifications aren't showing"
**Possible causes:**
1. Desktop notifications disabled in settings
   - **Fix:** Click "Notifications" → Turn ON desktop notifications
2. Browser permission not granted
   - **Fix:** Browser will ask for permission when you enable
3. Browser permission was blocked
   - **Fix:** 
     - Chrome: Click lock icon in address bar → Notifications → Allow
     - Firefox: Click shield icon → Permissions → Notifications → Allow
4. System notifications are disabled
   - **Fix:** Check OS notification settings (Windows/Mac)

### "Tab title isn't updating"
**Possible causes:**
1. Browser tab is pinned (pinned tabs show icons only)
   - **Solution:** Unpin the tab to see title
2. Using browser in fullscreen mode
   - **Solution:** Exit fullscreen to see tabs

### "Badge shows wrong count"
**Possible causes:**
1. Messages were read in another tab/device
   - **Solution:** Badge updates every 10 seconds, wait a moment
2. Network connection issue
   - **Solution:** Check internet connection

---

## 💡 Pro Tips

### Tip 1: Focus Mode
Want to focus without distractions?
1. Open Notifications settings
2. Turn OFF sound alerts
3. Turn OFF desktop notifications
4. Visual badges remain (check when ready)

### Tip 2: Important Messages
All messages are treated equally right now, but badges help you:
- 🟢 See at a glance how many unread messages
- 🔴 Badge color indicates you have unread items
- 📍 Multiple locations ensure you never miss a message

### Tip 3: Quick Access
Fastest ways to check messages:
1. **Click badge** on "Messages" in sidebar
2. **Click bell icon** in top bar
3. **Click desktop notification** (if shown)
4. **Press the browser tab** (see count in title)

### Tip 4: Privacy
- Message **content is never shown** in notifications
- Only the **count** is displayed
- Keeps your messages private in public settings

---

## 📊 Visual Guide

### Sidebar Badge States
```
┌─────────────────────────┐
│ 💬 Messages             │  ← No badge (0 unread)
└─────────────────────────┘

┌─────────────────────────┐
│ 💬 Messages         [3] │  ← Red badge with count
└─────────────────────────┘
     ↑                 ↑
  Icon has          Animated
  pulsing dot       count badge
```

### Bell Icon States
```
🔔              ← No notifications
🔔 [5]          ← 5 unread messages
   ↑
Animated badge
```

---

## ✅ Summary

You now have **4 ways** to know about new messages:

1. **👁️ Visual**: Badges on sidebar and bell icon
2. **📑 Tab Title**: Count in browser tab
3. **🔊 Audio**: Sound alert (optional)
4. **💻 Desktop**: Popup notification (optional)

**Control is in your hands:**
- All visual notifications are always on
- Sound and desktop notifications can be toggled
- Settings persist across sessions
- Privacy-focused (only shows count, not content)

**Never miss a message again!** 🎉

---

## Need Help?

If you have issues:
1. Check this guide's troubleshooting section
2. Try disabling and re-enabling the feature
3. Clear browser cache and reload
4. Check browser console for errors

**Enjoy your enhanced messaging experience!** ✨
