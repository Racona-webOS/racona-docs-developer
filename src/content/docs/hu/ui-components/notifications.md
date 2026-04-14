---
title: Toast értesítések
description: Toast üzenetek megjelenítése svelte-sonner-rel
---

A toast üzenetek rövid, átmeneti értesítések, amelyek a képernyő jobb felső sarkában jelennek meg. A Rocona a **svelte-sonner** könyvtárat használja.

## Alapvető használat

```svelte
<script>
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
</script>

<Button onclick={() => toast.success('Sikeres mentés!')}>
  Siker toast
</Button>

<Button onclick={() => toast.error('Hiba történt!')}>
  Hiba toast
</Button>

<Button onclick={() => toast.warning('Figyelmeztetés!')}>
  Figyelmeztetés toast
</Button>

<Button onclick={() => toast.info('Információ')}>
  Info toast
</Button>
```

## Toast típusok

### Success (Siker)

Sikeres műveletek visszajelzésére.

```svelte
toast.success('Felhasználó sikeresen létrehozva');
toast.success('Beállítások mentve');
toast.success('Fájl feltöltve');
```

**Szín:** Zöld
**Ikon:** Pipa

### Error (Hiba)

Sikertelen műveletek és hibák jelzésére.

```svelte
toast.error('Hiba történt a mentés során');
toast.error('Nem sikerült betölteni az adatokat');
toast.error('Nincs jogosultsága ehhez a művelethez');
```

**Szín:** Piros
**Ikon:** X

### Warning (Figyelmeztetés)

Fontos információk és figyelmeztetések.

```svelte
toast.warning('A művelet hosszabb időt vehet igénybe');
toast.warning('Néhány mező nincs kitöltve');
toast.warning('A munkamenet hamarosan lejár');
```

**Szín:** Sárga/Narancssárga
**Ikon:** Figyelmeztető háromszög

### Info (Információ)

Általános információk és tájékoztatók.

```svelte
toast.info('Adatok betöltése folyamatban');
toast.info('Link vágólapra másolva');
toast.info('Alkalmazás megnyitva');
```

**Szín:** Kék
**Ikon:** Információs ikon

### Default (Alapértelmezett)

Semleges üzenetek.

```svelte
toast('Művelet végrehajtva');
toast('Folyamat elindítva');
```

## Opciók

### Leírás hozzáadása

```svelte
toast.success('Mentve!', {
  description: 'A változtatások sikeresen mentésre kerültek.'
});
```

### Időtartam beállítása

```svelte
toast.success('Sikeres művelet', {
  duration: 5000 // 5 másodperc (default: 4000)
});

toast.info('Fontos információ', {
  duration: Infinity // Nem tűnik el automatikusan
});
```

### Művelet gomb

```svelte
toast.success('Fájl törölve', {
  action: {
    label: 'Visszavonás',
    onClick: () => {
      console.log('Visszavonva');
      // Visszavonási logika
    }
  }
});
```

### Pozíció

```svelte
toast.success('Üzenet', {
  position: 'top-right' // default
});

// Lehetséges értékek:
// 'top-left', 'top-center', 'top-right'
// 'bottom-left', 'bottom-center', 'bottom-right'
```

### Bezárás gomb

```svelte
toast.info('Információ', {
  closeButton: true // X gomb megjelenítése
});
```

## Promise toast

Aszinkron műveletek állapotának követése.

```svelte
<script>
  async function saveData() {
    const promise = fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    toast.promise(promise, {
      loading: 'Mentés folyamatban...',
      success: 'Sikeresen mentve!',
      error: 'Hiba történt a mentés során'
    });
  }
</script>
```

### Promise toast opciókkal

```svelte
toast.promise(
  fetch('/api/upload', { method: 'POST', body: formData }),
  {
    loading: 'Feltöltés...',
    success: (data) => {
      return `${data.fileName} sikeresen feltöltve`;
    },
    error: (err) => {
      return `Hiba: ${err.message}`;
    },
    duration: 5000
  }
);
```

## Egyedi toast

Teljes kontroll a toast tartalom felett.

```svelte
<script>
  import { toast } from 'svelte-sonner';

  function showCustomToast() {
    toast.custom(CustomToastComponent, {
      duration: 5000,
      componentProps: {
        title: 'Egyedi cím',
        message: 'Egyedi üzenet'
      }
    });
  }
</script>
```

## Toast bezárása

### Összes toast bezárása

```svelte
import { toast } from 'svelte-sonner';

toast.dismiss(); // Összes toast bezárása
```

### Specifikus toast bezárása

```svelte
const toastId = toast.success('Üzenet');

// Később bezárás
toast.dismiss(toastId);
```

## Példák

### CRUD műveletek

```svelte
<script>
  import { toast } from 'svelte-sonner';

  async function createUser(userData) {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        toast.success('Felhasználó létrehozva', {
          description: `${userData.name} sikeresen hozzáadva a rendszerhez.`
        });
      } else {
        throw new Error('Sikertelen létrehozás');
      }
    } catch (error) {
      toast.error('Hiba történt', {
        description: error.message
      });
    }
  }

  async function updateUser(userId, userData) {
    const promise = fetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });

    toast.promise(promise, {
      loading: 'Frissítés...',
      success: 'Felhasználó frissítve',
      error: 'Hiba történt a frissítés során'
    });
  }

  async function deleteUser(userId) {
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });

      toast.success('Felhasználó törölve', {
        action: {
          label: 'Visszavonás',
          onClick: () => restoreUser(userId)
        }
      });
    } catch (error) {
      toast.error('Törlés sikertelen');
    }
  }
</script>
```

### Vágólapra másolás

```svelte
<script>
  import { toast } from 'svelte-sonner';

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Vágólapra másolva', {
        description: text,
        duration: 2000
      });
    } catch (error) {
      toast.error('Másolás sikertelen');
    }
  }
</script>

<Button onclick={() => copyToClipboard('https://example.com')}>
  Link másolása
</Button>
```

### Fájl feltöltés

```svelte
<script>
  import { toast } from 'svelte-sonner';

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const promise = fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    toast.promise(promise, {
      loading: `${file.name} feltöltése...`,
      success: (response) => {
        return `${file.name} sikeresen feltöltve`;
      },
      error: 'Feltöltés sikertelen',
      duration: 3000
    });
  }
</script>
```

## Best practice-ek

1. **Minden művelet után** — Adj visszajelzést minden felhasználói művelet után
2. **Rövid üzenetek** — Tartsd az üzeneteket rövidnek és érthetőnek
3. **Megfelelő típus** — Használd a megfelelő toast típust (success, error, stb.)
4. **Leírás opcionális** — Csak akkor adj leírást, ha szükséges
5. **Promise toast** — Használd aszinkron műveleteknél
6. **Visszavonás gomb** — Adj lehetőséget a visszavonásra törlési műveleteknél
7. **Időtartam** — Fontos üzeneteknél növeld az időtartamot
8. **Ne spammeld** — Ne jelenítsd meg egyszerre túl sok toast-ot
9. **Error részletek** — Adj részletes hibainformációt fejlesztői módban
10. **Konzisztencia** — Használj egységes üzeneteket hasonló műveletekhez

## Kapcsolódó

- [Dialog komponensek →](./dialogs) — Modal ablakok
- [DataTable →](./datatable) — Adattáblák műveleteinek visszajelzése
- [Alapvető komponensek →](./basic) — Button komponens
