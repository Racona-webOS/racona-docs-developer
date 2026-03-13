---
title: Beállítások alkalmazás
description: Beállítások alkalmazás fejlesztői dokumentáció - architektúra, komponensek, server action-ök és integráció
---

A Beállítások alkalmazás az ElyOS központi beállítási felülete, ahol a felhasználók személyre szabhatják a rendszert. Ez az egyik legkomplexebb beépített alkalmazás, hierarchikus menüvel, számos beállítási szekcióval és szoros integrációval a téma- és desktop rendszerekkel.

## Áttekintés

**Hely:** `apps/web/src/apps/settings/`

**Jellemzők:**
- Hierarchikus menü struktúra (`menu.json`)
- 11 beállítási szekció (profil, biztonság, megjelenés, desktop, stb.)
- 3 server action fájl (profile, settings, theme-presets)
- Lokális store az UI állapot kezeléséhez
- Szoros integráció a ThemeManager-rel és DesktopManager-rel

**Hozzáférés:** Minden bejelentkezett felhasználó

## Fájl struktúra

```
settings/
├── index.svelte                    # App entry point
├── menu.json                       # Hierarchikus menü definíció
├── icon.svg                        # App ikon
├── profile.remote.ts               # Profil server action-ök
├── settings.remote.ts              # Beállítások server action-ök
├── theme-presets.remote.ts         # Téma preset server action-ök
├── components/                     # Beállítási szekciók
│   ├── ProfileSettings.svelte      # Profil (név, avatar, email)
│   ├── SecuritySettings.svelte     # Biztonság (2FA, jelszó)
│   ├── AppearanceSettings.svelte   # Megjelenés (téma, színek)
│   ├── BackgroundSettings.svelte   # Háttér (szín/kép/videó)
│   ├── DesktopSettings.svelte      # Desktop (kattintási mód)
│   ├── TaskbarSettings.svelte      # Tálca beállítások
│   ├── StartMenuSettings.svelte    # Start menü beállítások
│   ├── LanguageSettings.svelte     # Nyelv váltás
│   ├── PerformanceSettings.svelte  # Teljesítmény opciók
│   └── About.svelte                # Rendszer információk
├── stores/
│   ├── index.ts                    # Store export
│   └── settingsStore.svelte.ts     # SettingsManager store
└── utils/
    ├── avatar-helpers.ts           # Avatar prioritás logika
    ├── avatar-helpers.test.ts      # Avatar helper tesztek
    ├── profile-validation.ts       # Profil validáció
    └── profile-validation.test.ts  # Validáció tesztek
```

## Menü struktúra

A `menu.json` definiálja a hierarchikus menüt:

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

**Menü mezők:**
- `labelKey` — fordítási kulcs (`settings:menu.*`)
- `href` — URL hash navigációhoz
- `icon` — Lucide ikon neve
- `component` — betöltendő komponens neve
- `children` — almenü elemek (opcionális)
- `hideWhen` — feltételes elrejtés (pl. `singleLocale`)

## Server action-ök

### profile.remote.ts

**getProfile**

Lekéri a bejelentkezett felhasználó profil adatait.

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

**Visszatérési érték:**
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

Frissíti a felhasználó profil adatait.

```typescript
const updateProfileSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1, 'A név megadása kötelező'),
    v.maxLength(100, 'A név maximum 100 karakter lehet')
  ),
  username: v.optional(v.nullable(v.union([
    v.literal(''),
    v.pipe(
      v.string(),
      v.regex(/^[a-zA-Z0-9_]+$/, 'Csak betűk, számok és aláhúzás'),
      v.minLength(3, 'Minimum 3 karakter'),
      v.maxLength(50, 'Maximum 50 karakter')
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

Frissíti a felhasználói beállításokat (téma, háttér, desktop, taskbar, stb.).

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

  // Frissítjük a locals.settings-et is
  locals.settings = result.settings;

  return result;
});
```

**Használat:**

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
  toast.success('Beállítások mentve');
}
```

### theme-presets.remote.ts

**getThemePresets**

Lekéri az elérhető téma preset-eket az aktuális nyelven.

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

## Komponensek

### ProfileSettings.svelte

Profil kezelés: név, felhasználónév, avatar, email, csoportok, szerepkörök.

**Funkciók:**
- Avatar megjelenítés prioritási logikával (egyéni > OAuth > placeholder)
- Avatar feltöltés FileUploader-rel
- Név és felhasználónév szerkesztés validációval
- Csoportok és szerepkörök megjelenítése Badge-ekkel
- Action bar integráció (Szerkesztés/Mentés/Mégse gombok)

**Avatar prioritás:**

```typescript
// utils/avatar-helpers.ts
export function getDisplayedAvatar(profile: ProfileData): DisplayedAvatar {
  // 1. Egyéni feltöltött avatar (ha különbözik az OAuth képtől)
  if (profile.image && profile.image !== profile.oauthImage) {
    return { type: 'custom', url: profile.image };
  }

  // 2. OAuth szolgáltatótól származó kép
  if (profile.oauthImage) {
    return { type: 'oauth', url: profile.oauthImage };
  }

  // 3. Placeholder iniciálékkal
  return {
    type: 'placeholder',
    url: null,
    initials: getUserInitials(profile.name)
  };
}
```

**Validáció:**

```typescript
// utils/profile-validation.ts
export function validateName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'A név megadása kötelező' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'A név maximum 100 karakter lehet' };
  }
  return { valid: true };
}

export function validateUsername(username: string): ValidationResult {
  if (!username || username.length === 0) {
    return { valid: true }; // Opcionális mező
  }
  if (!/^[a-zA-Z0-9_]*$/.test(username)) {
    return {
      valid: false,
      error: 'Csak betűk, számok és aláhúzás'
    };
  }
  if (username.length < 3 || username.length > 50) {
    return { valid: false, error: 'Minimum 3, maximum 50 karakter' };
  }
  return { valid: true };
}
```

### SecuritySettings.svelte

Biztonsági beállítások: 2FA (TOTP), jelszó változtatás.

**2FA funkciók:**
- 2FA engedélyezése QR kóddal
- Backup kódok generálása és megjelenítése
- 2FA letiltása jelszóval
- Backup kódok másolása/letöltése

**Jelszó változtatás:**
- Jelenlegi jelszó ellenőrzés
- Új jelszó validáció (min. 8 karakter)
- Jelszó megerősítés
- Hibaüzenetek fordítása

**Használt better-auth funkciók:**

```typescript
// 2FA engedélyezése
const result = await authClient.twoFactor.enable({ password });
// result.data: { totpURI, backupCodes }

// 2FA ellenőrzése
await authClient.twoFactor.verifyTotp({ code });

// 2FA letiltása
await authClient.twoFactor.disable({ password });

// Backup kódok generálása
const result = await authClient.twoFactor.generateBackupCodes({ password });

// Jelszó változtatás
await authClient.changePassword({
  currentPassword,
  newPassword,
  revokeOtherSessions: false
});
```

### AppearanceSettings.svelte

Megjelenés beállítások: téma preset-ek, desktop mód, taskbar mód, színek, betűméret.

**Téma preset-ek:**
- Adatbázisból betöltött preset-ek
- Preset kártyák előnézettel (mód, szín, háttér indikátorok)
- Preset alkalmazása egy kattintással
- Aktív preset jelzése

**Desktop és Taskbar mód:**
- Világos/Sötét/Automatikus mód választó
- Vizuális korongok (swatches) a módokhoz
- Desktop mód változtatásakor taskbar mód is követi

**Színválasztó:**
- ColorHuePicker komponens
- Hue érték (0-360°) választása
- Valós idejű előnézet

**Betűméret:**
- Kis/Közepes/Nagy gombok
- Azonnali alkalmazás

### BackgroundSettings.svelte

Háttér beállítások: szín, kép, videó.

**Háttér típusok:**
- **Szín:** ColorPicker komponens
- **Kép:** Shared és user scope képek, FileUploader
- **Videó:** Shared videók thumbnail előnézettel

**Kép funkciók:**
- Rendszer képek (shared scope)
- Saját képek feltöltése (user scope)
- Thumbnail generálás
- Kép törlése (csak user scope)
- Homályosítás (blur) slider (0-30px)
- Szürkeárnyalatos mód kapcsoló

**Videó funkciók:**
- Shared videók listázása
- Thumbnail előnézet (`.jpg` fájlok)
- Videó kiválasztása

### DesktopSettings.svelte

Desktop beállítások: kattintási mód.

**Kattintási módok:**
- **Egyszeres kattintás:** Fájlok és mappák megnyitása egy kattintással
- **Dupla kattintás:** Hagyományos dupla kattintás

**Implementáció:**

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

Tálca beállítások: pozíció, stílus, elemek láthatósága.

### StartMenuSettings.svelte

Start menü beállítások: nézet mód (rács/lista).

### LanguageSettings.svelte

Nyelv váltás: támogatott nyelvek listája, locale váltás.

### PerformanceSettings.svelte

Teljesítmény opciók: teljesítmény preferencia, ablak előnézet, screenshot thumbnail méret.

### About.svelte

Rendszer információk: verzió, licenc, közreműködők.

## SettingsStore

Lokális UI állapot kezelése (nem perzisztens beállítások).

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

**Használat:**

```typescript
const settingsManager = createSettingsManager();
settingsManager.setActiveTab('appearance');
```

## Integráció más rendszerekkel

### ThemeManager integráció

A Settings app kétirányú integrációban van a ThemeManager-rel:

**Settings → Theme:**

```typescript
// Téma beállítások frissítése
await updateSettings({
  theme: {
    mode: 'dark',
    colorPrimaryHue: '220',
    fontSize: 'medium'
  }
});

// Invalidálás után a ThemeManager automatikusan frissül
await invalidate('app:settings');
```

**Theme → Settings:**

A `settings` objektum a kontextusból jön, amely a `locals.settings`-ből töltődik be:

```svelte
<script>
  const settings = getContext('settings');
  // settings.theme.mode, settings.theme.colorPrimaryHue, stb.
</script>
```

### DesktopManager integráció

A desktop beállítások (kattintási mód) a DesktopManager-en keresztül érvényesülnek:

```typescript
await updateSettings({
  desktop: { clickMode: 'single' }
});
```

### FileUploader integráció

Avatar és háttérkép feltöltés:

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

## Fordítások

A Settings app fordításai a `settings` namespace-ben vannak:

```sql
-- translations_settings.sql
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'menu.account', 'Fiók'),
('hu', 'settings', 'menu.security', 'Biztonság'),
('hu', 'settings', 'menu.appearance', 'Megjelenés'),
('hu', 'settings', 'profile.title', 'Profil beállítások'),
('hu', 'settings', 'profile.name.label', 'Név'),
('hu', 'settings', 'security.2fa.title', 'Kétfaktoros hitelesítés'),
('hu', 'settings', 'appearance.themeMode.light', 'Világos'),
-- ... további fordítások
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value;
```

**Használat:**

```svelte
<script>
  import { useI18n } from '$lib/i18n/hooks';
  const { t } = useI18n();
</script>

<h2>{t('settings.profile.title')}</h2>
<Label>{t('settings.profile.name.label')}</Label>
```

## Tesztelés

### Unit tesztek

**Avatar helper tesztek:**

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

**Profil validáció tesztek:**

```typescript
// utils/profile-validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateName, validateUsername } from './profile-validation';

describe('validateName', () => {
  it('should accept valid names', () => {
    expect(validateName('John Doe').valid).toBe(true);
  });

  it('should reject empty names', () => {
    expect(validateName('').valid).toBe(false);
    expect(validateName('   ').valid).toBe(false);
  });

  it('should reject names over 100 characters', () => {
    const longName = 'a'.repeat(101);
    expect(validateName(longName).valid).toBe(false);
  });
});

describe('validateUsername', () => {
  it('should accept valid usernames', () => {
    expect(validateUsername('john_doe').valid).toBe(true);
    expect(validateUsername('user123').valid).toBe(true);
  });

  it('should accept empty username (optional)', () => {
    expect(validateUsername('').valid).toBe(true);
  });

  it('should reject invalid characters', () => {
    expect(validateUsername('user@name').valid).toBe(false);
    expect(validateUsername('user-name').valid).toBe(false);
  });

  it('should reject usernames under 3 characters', () => {
    expect(validateUsername('ab').valid).toBe(false);
  });
});
```

## Best practice-ek

1. **Mindig használj invalidate-et** — beállítások frissítése után `invalidate('app:settings')`
2. **Validálj kliens és szerver oldalon is** — dupla védelem
3. **Használj toast értesítéseket** — felhasználói visszajelzés
4. **Debounce slider értékeket** — ne mentsd minden mozdulatnál
5. **Kezelj OAuth avatar-okat** — ne engedd felülírni az OAuth képet
6. **Használj ContentSection-t** — egységes megjelenés
7. **Action bar integráció** — Szerkesztés/Mentés gombok az action bar-ban

## Gyakori hibák

**Probléma:** Beállítások nem frissülnek azonnal

**Megoldás:** Használd az `invalidate('app:settings')` függvényt a mentés után.

---

**Probléma:** Avatar nem jelenik meg OAuth bejelentkezés után

**Megoldás:** Ellenőrizd az avatar prioritási logikát a `getDisplayedAvatar` függvényben.

---

**Probléma:** Téma preset nem alkalmaz hátteret

**Megoldás:** Ellenőrizd, hogy a preset `settings.background` objektuma tartalmazza a `type`, `value` és `scope` mezőket.

## További információk

- [Állapotkezelés](/state-management) — Store-ok használata
- [Server Actions](/server-actions) — Command/query pattern
- [Validáció](/data-validation) — Valibot sémák
- [Adatbázis](/database) — UserRepository használata
- [Többnyelvűség](/i18n) — Fordítások kezelése
