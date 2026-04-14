---
title: Toast Notifications
description: Displaying toast messages with svelte-sonner
---

Toast messages are short, transient notifications that appear in the top right corner of the screen. Racona uses the **svelte-sonner** library.

## Basic Usage

```svelte
<script>
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
</script>

<Button onclick={() => toast.success('Saved successfully!')}>
  Success toast
</Button>

<Button onclick={() => toast.error('An error occurred!')}>
  Error toast
</Button>

<Button onclick={() => toast.warning('Warning!')}>
  Warning toast
</Button>

<Button onclick={() => toast.info('Information')}>
  Info toast
</Button>
```

## Toast Types

### Success

For feedback on successful operations.

```svelte
toast.success('User created successfully');
toast.success('Settings saved');
toast.success('File uploaded');
```

**Color:** Green | **Icon:** Checkmark

### Error

For indicating failed operations and errors.

```svelte
toast.error('Error saving data');
toast.error('Failed to load data');
toast.error('You do not have permission for this action');
```

**Color:** Red | **Icon:** X

### Warning

For important information and warnings.

```svelte
toast.warning('The operation may take a while');
toast.warning('Some fields are not filled in');
toast.warning('Your session will expire soon');
```

**Color:** Yellow/Orange | **Icon:** Warning triangle

### Info

For general information and notices.

```svelte
toast.info('Loading data...');
toast.info('Link copied to clipboard');
toast.info('Application opened');
```

**Color:** Blue | **Icon:** Info icon

### Default

For neutral messages.

```svelte
toast('Operation completed');
toast('Process started');
```

## Options

### Adding a Description

```svelte
toast.success('Saved!', {
  description: 'Changes have been saved successfully.'
});
```

### Setting Duration

```svelte
toast.success('Successful operation', {
  duration: 5000 // 5 seconds (default: 4000)
});

toast.info('Important information', {
  duration: Infinity // Does not disappear automatically
});
```

### Action Button

```svelte
toast.success('File deleted', {
  action: {
    label: 'Undo',
    onClick: () => {
      console.log('Undone');
      // Undo logic
    }
  }
});
```

### Position

```svelte
toast.success('Message', {
  position: 'top-right' // default
});

// Possible values:
// 'top-left', 'top-center', 'top-right'
// 'bottom-left', 'bottom-center', 'bottom-right'
```

### Close Button

```svelte
toast.info('Information', {
  closeButton: true // Show X button
});
```

## Promise Toast

Track the state of async operations.

```svelte
<script>
  async function saveData() {
    const promise = fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    toast.promise(promise, {
      loading: 'Saving...',
      success: 'Saved successfully!',
      error: 'Error saving data'
    });
  }
</script>
```

### Promise Toast with Options

```svelte
toast.promise(
  fetch('/api/upload', { method: 'POST', body: formData }),
  {
    loading: 'Uploading...',
    success: (data) => {
      return `${data.fileName} uploaded successfully`;
    },
    error: (err) => {
      return `Error: ${err.message}`;
    },
    duration: 5000
  }
);
```

## Dismissing Toasts

### Dismiss All Toasts

```svelte
import { toast } from 'svelte-sonner';

toast.dismiss(); // Dismiss all toasts
```

### Dismiss Specific Toast

```svelte
const toastId = toast.success('Message');

// Dismiss later
toast.dismiss(toastId);
```

## Examples

### CRUD Operations

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
        toast.success('User created', {
          description: `${userData.name} has been added to the system.`
        });
      } else {
        throw new Error('Creation failed');
      }
    } catch (error) {
      toast.error('An error occurred', {
        description: error.message
      });
    }
  }

  async function deleteUser(userId) {
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });

      toast.success('User deleted', {
        action: {
          label: 'Undo',
          onClick: () => restoreUser(userId)
        }
      });
    } catch (error) {
      toast.error('Deletion failed');
    }
  }
</script>
```

### Copy to Clipboard

```svelte
<script>
  import { toast } from 'svelte-sonner';

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard', {
        description: text,
        duration: 2000
      });
    } catch (error) {
      toast.error('Copy failed');
    }
  }
</script>

<Button onclick={() => copyToClipboard('https://example.com')}>
  Copy link
</Button>
```

### File Upload

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
      loading: `Uploading ${file.name}...`,
      success: () => `${file.name} uploaded successfully`,
      error: 'Upload failed',
      duration: 3000
    });
  }
</script>
```

## Best Practices

1. **After every operation** — Give feedback after every user action
2. **Short messages** — Keep messages short and clear
3. **Appropriate type** — Use the right toast type (success, error, etc.)
4. **Description optional** — Only add description when necessary
5. **Promise toast** — Use for async operations
6. **Undo button** — Offer undo option for delete operations
7. **Duration** — Increase duration for important messages
8. **Don't spam** — Don't show too many toasts at once
9. **Error details** — Provide detailed error info in dev mode
10. **Consistency** — Use consistent messages for similar operations

## Related

- [Dialog Components →](./dialogs) — Modal windows
- [DataTable →](./datatable) — Feedback for table actions
- [Basic Components →](./basic) — Button component
