# Components Documentation

## Available Nuxt UI Components

This project uses [Nuxt UI](https://ui.nuxt.com/) for consistent, accessible UI components.

### Layout Components
- `UHeader` - Application header with left/right slots
- `UFooter` - Application footer
- `AppLayout` - Main application layout wrapper

### Form Components
- `UButton` - Buttons with multiple variants (primary, outline, ghost)
- `UInput` - Text input fields
- `UFormGroup` - Form field wrapper with label and help text

### Display Components
- `UCard` - Content cards with header/body slots
- `UAlert` - Alert messages with icons and colors
- `UBadge` - Status badges and labels
- `UIcon` - Icon component using Heroicons

### Usage Examples

```vue
<!-- Button with icon -->
<UButton color="primary" size="lg">
  <UIcon name="i-heroicons-play" class="w-5 h-5 mr-2" />
  Start Action
</UButton>

<!-- Form input -->
<UFormGroup label="Email" help="Enter your email address">
  <UInput v-model="email" type="email" placeholder="john@example.com" />
</UFormGroup>

<!-- Alert message -->
<UAlert
  icon="i-heroicons-information-circle"
  color="blue"
  variant="soft"
  title="Information"
  description="This is an informational message."
/>
```

### Available Colors
- `primary` (blue)
- `gray`
- `green`
- `red`
- `yellow`
- `blue`

### Available Button Variants
- `solid` (default)
- `outline`
- `ghost`
- `link`

For more details, visit the [Nuxt UI Documentation](https://ui.nuxt.com/).
