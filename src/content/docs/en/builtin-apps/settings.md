---
title: Settings App
description: Settings app developer documentation - architecture, components, server actions and integration
---

The Settings app is Racona's central configuration interface where users can personalize the system. It is one of the most complex built-in apps, featuring a hierarchical menu, numerous settings sections, and tight integration with the theme and desktop systems.

## Overview

**Location:** `apps/web/src/apps/settings/`

**Features:**
- Hierarchical menu structure (`menu.json`)
- 11 settings sections (profile, security, appearance, desktop, etc.)
- 3 server action files (profile, settings, theme-presets)
- Local store for UI state management
- Tight integration with ThemeManager and DesktopManager

**Access:** All authenticated users

## File Structure

```
settings/
├── index.svelte                    # App entry point
├── menu.json                       # Hierarchical menu definition
├── icon.svg                        # App icon
├── profile.remote.ts               # Profile server actions
├── settings.remote.ts              # Settings server actions
├── theme-presets.remote.ts         # Theme preset server actions
├── components/                     # Settings sections
│   ├── ProfileSettings.svelte      # Profile (name, avatar, email)
│   ├── SecuritySettings.svelte     # Security (2FA, password)
│   ├── AppearanceSettings.svelte   # Appearance (theme, colors)
│   ├── BackgroundSettings.svelte   # Background (color/image/video)
│   ├── DesktopSettings.svelte      # Desktop (click mode)
│   ├── TaskbarSettings.svelte      # Taskbar settings
│   ├── StartMenuSettings.svelte    # Start menu settings
│   ├── LanguageSettings.svelte     # Language switching
│   ├── PerformanceSettings.svelte  # Performance options
│   └── About.svelte                # System information
├── stores/
│   ├── index.ts                    # Store export
│   └── settingsStore.svelte.ts     # SettingsManager store
└── utils/
    ├── avatar-helpers.ts           # Avatar priority logic
    ├── avatar-helpers.test.ts      # Avatar helper tests
    ├── profile-validation.ts       # Profile validation
    └── profile-validation.test.ts  # Validation tests
```

## Menu Structure

The `menu.json` defines the hierarchical menu:

```json
[
  {
    "labelKey": "menu.account",
    "href": "#profile",
    "icon": "UserPen",
    "component": "ProfileSettings"
  },
  {
    "labelKey": "menu.security",
    "href": "#security",
    "icon": "Shield",
    "component": "SecuritySettings"
  },
  {
    "labelKey": "menu.desktop",
    "href": "#",
    "icon": "Monitor",
    "children": [
      {
        "labelKey": "menu.general",
        "href": "#desktop",
        "icon": "Settings",
        "component": "DesktopSettings"
      },
      {
        "labelKey": "menu.background",
        "href": "#background",
        "icon": "Image",
        "component": "BackgroundSettings"
      }
    ]
  }
]
```

**Menu fields:**
- `labelKey` — translation key (`settings:menu.*`)
- `href` — URL hash for navigation
- `icon` — Lucide icon name
- `component` — component name to load
- `children` — submenu items (optional)
- `hideWhen` — conditional hiding (e.g. `singleLocale`)

## Server Actions

### profile.remote.ts

**getProfile**

Retrieves the logged-in user's profile data.

```typescript
export const getProfile = command(emptySchema, async () => {
  const userId = parseInt(locals.user.id);
  const profile = await userRepository.getProfileWithOAuth(userId);
  const userWithGroupsAndRoles = await userRepository.findByIdWithGroupsAndRoles(userId);

  return {
    success: true,
    profile: {
      ...profile,
      groups: userWithGroupsAndRoles?.groups || [],
      roles: userWithGroupsAndRoles?.roles || []
    }
  };
});
```

**Return value:**
```typescript
{
  success: boolean;
  profile?: {
    id: number;
    name: string;
    email: string;
    username: string | null;
    image: string | null;
    oauthImage: string | null;
    oauthProvider: string | null;
    createdAt: Date;
    groups: Array<{ id, name, description }>;
    roles: Array<{ id, name, description }>;
  };
  error?: string;
}
```

**updateProfile**

Updates the user's profile data.

```typescript
const updateProfileSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1, 'Name is required'),
    v.maxLength(100, 'Name can be at most 100 characters')
  ),
  username: v.optional(v.nullable(v.union([
    v.literal(''),
    v.pipe(
      v.string(),
      v.regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
      v.minLength(3, 'Minimum 3 characters'),
      v.maxLength(50, 'Maximum 50 characters')
    )
  ]))),
  image: v.optional(v.nullable(v.string()))
});

export const updateProfile = command(updateProfileSchema, async (data) => {
  const userId = parseInt(locals.user.id);
  const result = await userRepository.updateProfile(userId, {
    name: data.name.trim(),
    username: data.username === '' ? null : data.username,
    image: data.image
  });

  return result;
});
```

### settings.remote.ts

**updateSettings**

Updates user settings (theme, background, desktop, taskbar, etc.).

```typescript
const updateSettingsSchema = v.object({
  preferPerformance: v.optional(v.boolean()),
  windowPreview: v.optional(v.boolean()),
  screenshotThumbnailHeight: v.optional(v.pipe(v.number(), v.minValue(100), v.maxValue(200))),
  background: v.optional(v.object({
    type: v.optional(v.picklist(['color', 'image', 'video'])),
    value: v.optional(v.string()),
    scope: v.optional(v.picklist(['shared', 'user'])),
    blur: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(30))),
    grayscale: v.optional(v.boolean())
  })),
  theme: v.optional(v.object({
    mode: v.optional(v.picklist(['light', 'dark', 'auto'])),
    modeTaskbarStartMenu: v.optional(v.picklist(['light', 'dark', 'auto'])),
    colorPrimaryHue: v.optional(v.string()),
    fontSize: v.optional(v.picklist(['small', 'medium', 'large']))
  })),
  taskbar: v.optional(v.object({
    position: v.optional(v.picklist(['top', 'bottom', 'left', 'right'])),
    style: v.optional(v.picklist(['classic', 'modern'])),
    itemVisibility: v.optional(v.record(v.string(), v.boolean()))
  })),
  startMenu: v.optional(v.object({
    viewMode: v.optional(v.picklist(['grid', 'list']))
  })),
  desktop: v.optional(v.object({
    clickMode: v.optional(v.picklist(['single', 'double']))
  }))
});

export const updateSettings = command(updateSettingsSchema, async (updates) => {
  const userId = parseInt(locals.user.id);
  const result = await userRepository.patchUserSettings(userId, updates);

  // Also update locals.settings
  locals.settings = result.settings;

  return result;
});
```

**Usage:**

```typescript
const result = await updateSettings({
  theme: {
    mode: 'dark',
    colorPrimaryHue: '220'
  },
  desktop: {
    clickMode: 'single'
  }
});

if (result.success) {
  await invalidate('app:settings');
  toast.success('Settings saved');
}
```

### theme-presets.remote.ts

**getThemePresets**

Retrieves available theme presets in the current locale.

```typescript
export const getThemePresets = command(
  v.object({
    locale: v.pipe(v.string(), v.minLength(2))
  }),
  async ({ locale }) => {
    const presets = await themePresetsRepository.getAll(locale);
    return presets;
  }
);
```

## Components

### ProfileSettings.svelte

Profile management: name, username, avatar, email, groups, roles.

**Features:**
- Avatar display with priority logic (custom > OAuth > placeholder)
- Avatar upload with FileUploader
- Name and username editing with validation
- Groups and roles displayed with Badges
- Action bar integration (Edit/Save/Cancel buttons)

**Avatar priority:**

```typescript
// utils/avatar-helpers.ts
export function getDisplayedAvatar(profile: ProfileData): DisplayedAvatar {
  // 1. Custom uploaded avatar (if different from OAuth image)
  if (profile.image && profile.image !== profile.oauthImage) {
    return { type: 'custom', url: profile.image };
  }

  // 2. Image from OAuth provider
  if (profile.oauthImage) {
    return { type: 'oauth', url: profile.oauthImage };
  }

  // 3. Placeholder with initials
  return {
    type: 'placeholder',
    url: null,
    initials: getUserInitials(profile.name)
  };
}
```

**Validation:**

```typescript
// utils/profile-validation.ts
export function validateName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Name can be at most 100 characters' };
  }
  return { valid: true };
}

export function validateUsername(username: string): ValidationResult {
  if (!username || username.length === 0) {
    return { valid: true }; // Optional field
  }
  if (!/^[a-zA-Z0-9_]*$/.test(username)) {
    return {
      valid: false,
      error: 'Only letters, numbers and underscores'
    };
  }
  if (username.length < 3 || username.length > 50) {
    return { valid: false, error: 'Minimum 3, maximum 50 characters' };
  }
  return { valid: true };
}
```

### SecuritySettings.svelte

Security settings: 2FA (TOTP), password change.

**2FA features:**
- Enable 2FA with QR code
- Generate and display backup codes
- Disable 2FA with password
- Copy/download backup codes

**Password change:**
- Current password verification
- New password validation (min. 8 characters)
- Password confirmation
- Error message translation

**Used better-auth functions:**

```typescript
// Enable 2FA
const result = await authClient.twoFactor.enable({ password });
// result.data: { totpURI, backupCodes }

// Verify 2FA
await authClient.twoFactor.verifyTotp({ code });

// Disable 2FA
await authClient.twoFactor.disable({ password });

// Generate backup codes
const result = await authClient.twoFactor.generateBackupCodes({ password });

// Change password
await authClient.changePassword({
  currentPassword,
  newPassword,
  revokeOtherSessions: false
});
```

### AppearanceSettings.svelte

Appearance settings: theme presets, desktop mode, taskbar mode, colors, font size.

**Theme presets:**
- Presets loaded from database
- Preset cards with preview (mode, color, background indicators)
- Apply preset with one click
- Active preset indicator

**Desktop and Taskbar mode:**
- Light/Dark/Auto mode selector
- Visual swatches for modes
- Taskbar mode follows desktop mode changes

**Color picker:**
- ColorHuePicker component
- Hue value (0-360°) selection
- Real-time preview

**Font size:**
- Small/Medium/Large buttons
- Immediate application

### BackgroundSettings.svelte

Background settings: color, image, video.

**Background types:**
- **Color:** ColorPicker component
- **Image:** Shared and user scope images, FileUploader
- **Video:** Shared videos with thumbnail preview

**Image features:**
- System images (shared scope)
- Upload custom images (user scope)
- Thumbnail generation
- Delete image (user scope only)
- Blur slider (0-30px)
- Grayscale mode toggle

**Video features:**
- List shared videos
- Thumbnail preview (`.jpg` files)
- Select video

### DesktopSettings.svelte

Desktop settings: click mode.

**Click modes:**
- **Single click:** Open files and folders with a single click
- **Double click:** Traditional double-click

**Implementation:**

```svelte
<Button
  variant={settings.desktop.clickMode === 'single' ? 'default' : 'outline'}
  onclick={() => handleClickModeChange('single')}
>
  <MousePointerClick size={14} />
  {t('settings.desktop.clickMode.single')}
</Button>
```

### TaskbarSettings.svelte

Taskbar settings: position, style, item visibility.

### StartMenuSettings.svelte

Start menu settings: view mode (grid/list).

### LanguageSettings.svelte

Language switching: list of supported languages, locale switching.

### PerformanceSettings.svelte

Performance options: performance preference, window preview, screenshot thumbnail size.

### About.svelte

System information: version, license, contributors.

## SettingsStore

Local UI state management (non-persistent settings).

```typescript
// stores/settingsStore.svelte.ts
interface SettingsState {
  activeTab: string;
  isDirty: boolean;
  isLoading: boolean;
}

export class SettingsManager {
  state = $state<SettingsState>({
    activeTab: 'general',
    isDirty: false,
    isLoading: false
  });

  setActiveTab(tab: string) {
    this.state.activeTab = tab;
  }

  setDirty(isDirty: boolean) {
    this.state.isDirty = isDirty;
  }

  setLoading(isLoading: boolean) {
    this.state.isLoading = isLoading;
  }

  reset() {
    this.state = { ...initialState };
  }
}
```

**Usage:**

```typescript
const settingsManager = createSettingsManager();
settingsManager.setActiveTab('appearance');
```

## Integration with Other Systems

### ThemeManager Integration

The Settings app has bidirectional integration with ThemeManager:

**Settings → Theme:**

```typescript
// Update theme settings
await updateSettings({
  theme: {
    mode: 'dark',
    colorPrimaryHue: '220',
    fontSize: 'medium'
  }
});

// After invalidation, ThemeManager updates automatically
await invalidate('app:settings');
```

**Theme → Settings:**

The `settings` object comes from context, loaded from `locals.settings`:

```svelte
<script>
  const settings = getContext('settings');
  // settings.theme.mode, settings.theme.colorPrimaryHue, etc.
</script>
```

### DesktopManager Integration

Desktop settings (click mode) take effect through DesktopManager:

```typescript
await updateSettings({
  desktop: { clickMode: 'single' }
});
```

### FileUploader Integration

Avatar and background image upload:

```svelte
<FileUploader
  mode="instant"
  category="avatars"
  scope="user"
  maxFiles={1}
  fileType="image"
  maxFileSize={5 * 1024 * 1024}
  generateThumbnail={true}
  onUploadComplete={handleAvatarUpload}
/>
```

## Translations

Settings app translations are in the `settings` namespace:

```sql
-- translations_settings.sql
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'menu.account', 'Account'),
('en', 'settings', 'menu.security', 'Security'),
('en', 'settings', 'menu.appearance', 'Appearance'),
('en', 'settings', 'profile.title', 'Profile settings'),
('en', 'settings', 'profile.name.label', 'Name'),
('en', 'settings', 'security.2fa.title', 'Two-factor authentication'),
('en', 'settings', 'appearance.themeMode.light', 'Light'),
-- ... more translations
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value;
```

**Usage:**

```svelte
<script>
  import { useI18n } from '$lib/i18n/hooks';
  const { t } = useI18n();
</script>

<h2>{t('settings.profile.title')}</h2>
<Label>{t('settings.profile.name.label')}</Label>
```

## Testing

### Unit Tests

**Avatar helper tests:**

```typescript
// utils/avatar-helpers.test.ts
import { describe, it, expect } from 'vitest';
import { getDisplayedAvatar, getUserInitials } from './avatar-helpers';

describe('getDisplayedAvatar', () => {
  it('should prioritize custom image over OAuth image', () => {
    const profile = {
      image: '/custom.jpg',
      oauthImage: '/oauth.jpg',
      name: 'John Doe'
    };
    const result = getDisplayedAvatar(profile);
    expect(result.type).toBe('custom');
    expect(result.url).toBe('/custom.jpg');
  });

  it('should use OAuth image if no custom image', () => {
    const profile = {
      image: null,
      oauthImage: '/oauth.jpg',
      name: 'John Doe'
    };
    const result = getDisplayedAvatar(profile);
    expect(result.type).toBe('oauth');
    expect(result.url).toBe('/oauth.jpg');
  });

  it('should use placeholder with initials if no images', () => {
    const profile = {
      image: null,
      oauthImage: null,
      name: 'John Doe'
    };
    const result = getDisplayedAvatar(profile);
    expect(result.type).toBe('placeholder');
    expect(result.initials).toBe('JD');
  });
});
```

## Best Practices

1. **Always use invalidate** — after saving settings use `invalidate('app:settings')`
2. **Validate on both client and server** — double protection
3. **Use toast notifications** — user feedback
4. **Debounce slider values** — don't save on every movement
5. **Handle OAuth avatars** — don't allow overwriting the OAuth image
6. **Use ContentSection** — consistent appearance
7. **Action bar integration** — Edit/Save buttons in the action bar

## Common Issues

**Problem:** Settings don't update immediately

**Solution:** Use `invalidate('app:settings')` after saving.

---

**Problem:** Avatar doesn't appear after OAuth login

**Solution:** Check the avatar priority logic in the `getDisplayedAvatar` function.

---

**Problem:** Theme preset doesn't apply background

**Solution:** Verify that the preset's `settings.background` object contains `type`, `value` and `scope` fields.

## Further Reading

- [State Management](/en/state-management) — Using stores
- [Server Actions](/en/server-actions) — Command/query pattern
- [Validation](/en/data-validation) — Valibot schemas
- [Database](/en/database) — UserRepository usage
- [Internationalization](/en/i18n) — Managing translations
