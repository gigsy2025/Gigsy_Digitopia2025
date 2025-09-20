---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---

# GitHub Copilot Instructions: Tailwind CSS Best Practices

## Foundational Design Philosophy

When approaching any styling task, think of Tailwind CSS as a comprehensive design language that bridges the gap between design systems and implementation. Every utility class represents a deliberate design decision that maintains consistency across your entire application while providing the flexibility to create unique user experiences. The goal is not simply to apply styles, but to build interfaces that feel cohesive, accessible, and delightfully functional across all devices and user preferences.

Modern interface design requires thinking beyond static layouts to create adaptive experiences that work seamlessly across the spectrum of devices, screen sizes, and user accessibility needs. Tailwind provides the tools to implement these adaptive designs through its utility-first approach, but the key lies in understanding how to orchestrate these utilities to create interfaces that feel intentional and polished rather than fragmented or inconsistent.

## Responsive Design Excellence

Approach every interface element with a mobile-first mindset that progressively enhances the experience as screen real estate increases. When suggesting any layout or styling code, always consider how the interface will adapt across the full range of device sizes, from compact mobile screens to expansive desktop displays. This means starting with the most constrained context and layering on enhancements that take advantage of larger screens.

The responsive utility system in Tailwind follows a logical progression that mirrors how users actually experience interfaces across different devices. The base utilities apply to all screen sizes, while the responsive prefixes add enhancements at specific breakpoints. This approach ensures that your interface remains functional and attractive regardless of the viewing context.

```typescript
// Always structure responsive layouts with progressive enhancement
const ResponsiveCard = () => {
  return (
    <div className="
      // Base mobile-first styling - works on all devices
      p-4 rounded-lg shadow-sm bg-white dark:bg-gray-900

      // Small tablet enhancements - more breathing room
      sm:p-6 sm:rounded-xl sm:shadow-md

      // Tablet and small desktop - refined proportions
      md:p-8 md:max-w-md md:mx-auto

      // Desktop - optimal reading width and enhanced visual hierarchy
      lg:max-w-lg lg:p-10 lg:shadow-lg

      // Large desktop - maintain readability, prevent content from becoming too wide
      xl:max-w-xl
    ">
      <h2 className="
        // Mobile typography - clear and readable
        text-lg font-semibold text-gray-900 dark:text-white

        // Enhanced typography for larger screens
        sm:text-xl md:text-2xl lg:text-3xl
      ">
        Responsive Content
      </h2>

      <p className="
        // Mobile text - optimized for small screens
        mt-2 text-sm text-gray-600 dark:text-gray-300

        // Progressive text sizing and spacing
        sm:mt-3 sm:text-base md:mt-4 md:text-lg
      ">
        Content that adapts beautifully to any screen size
      </p>
    </div>
  );
};
```

## Dark Mode Implementation Strategy

Implement dark mode support as a fundamental design consideration rather than an afterthought. Every color choice should be consciously made with both light and dark themes in mind, creating experiences that feel natural and comfortable in either context. Dark mode is not simply about inverting colors, but about creating appropriate contrast relationships and visual hierarchies that work well in low-light environments.

When suggesting color utilities, always provide both light and dark variants that maintain proper contrast ratios for accessibility. The dark mode utilities in Tailwind allow you to create sophisticated theming that responds intelligently to user preferences while maintaining your brand identity and visual hierarchy.

```typescript
// Comprehensive dark mode implementation with semantic color usage
const ThemedInterface = () => {
  return (
    <div className="
      // Background colors that work in both themes
      bg-white dark:bg-gray-900

      // Border colors with appropriate contrast
      border border-gray-200 dark:border-gray-700

      // Text colors that maintain readability
      text-gray-900 dark:text-white
    ">
      <nav className="
        // Navigation styling with theme-aware colors
        p-4 border-b border-gray-200 dark:border-gray-700
        bg-gray-50 dark:bg-gray-800
      ">
        <h1 className="
          // Primary heading with strong contrast in both themes
          text-xl font-bold text-gray-900 dark:text-white
        ">
          Application Title
        </h1>
      </nav>

      <main className="p-6">
        <div className="
          // Card component with thoughtful theming
          p-6 rounded-xl shadow-sm
          bg-white dark:bg-gray-800
          border border-gray-100 dark:border-gray-700
        ">
          <h2 className="
            // Secondary heading with appropriate contrast
            text-lg font-semibold text-gray-800 dark:text-gray-100
          ">
            Content Section
          </h2>

          <p className="
            // Body text with reduced contrast for comfortable reading
            mt-3 text-gray-600 dark:text-gray-300
          ">
            Text content that remains readable and comfortable in both light and dark themes.
          </p>

          <button className="
            // Interactive element with proper state styling
            mt-4 px-4 py-2 rounded-lg font-medium
            bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400
            text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-800
            transition-colors duration-200
          ">
            Action Button
          </button>
        </div>
      </main>
    </div>
  );
};
```

## Material Design Integration Principles

Draw inspiration from Material Design's thoughtful approach to elevation, typography, and interaction patterns while adapting these concepts to work seamlessly with Tailwind's utility system. Material Design provides a comprehensive framework for creating interfaces that feel intuitive and responsive to user interactions. The key is translating Material Design's systematic approach to visual hierarchy and interaction feedback into Tailwind utilities.

Material Design's elevation system creates depth and hierarchy through strategic use of shadows and layering. When implementing these concepts with Tailwind, consider how different shadow utilities can establish content hierarchy and provide visual feedback for interactive elements. The goal is creating interfaces that guide users naturally through content and interactions.

```typescript
// Material Design-inspired component with proper elevation and interaction patterns
const MaterialCard = ({ title, content, actions }) => {
  return (
    <div className="
      // Base card styling with Material Design elevation
      bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg

      // Smooth transitions for interaction feedback
      transition-all duration-300 ease-out

      // Interactive elevation changes
      hover:scale-[1.02] hover:-translate-y-1

      // Responsive sizing and spacing
      p-6 md:p-8 max-w-sm md:max-w-md
    ">
      {/* Header section with Material Design typography scale */}
      <div className="mb-4">
        <h3 className="
          // Material Design headline typography
          text-xl md:text-2xl font-medium text-gray-900 dark:text-white
          tracking-tight leading-tight
        ">
          {title}
        </h3>
      </div>

      {/* Content section with proper text hierarchy */}
      <div className="mb-6">
        <p className="
          // Material Design body text with optimal line height
          text-gray-600 dark:text-gray-300 leading-relaxed
          text-sm md:text-base
        ">
          {content}
        </p>
      </div>

      {/* Action area with Material Design button patterns */}
      <div className="flex gap-3 justify-end">
        {actions.map((action, index) => (
          <button
            key={index}
            className="
              // Material Design button styling
              px-4 py-2 rounded-full font-medium text-sm

              // Primary action styling
              bg-blue-600 hover:bg-blue-700 active:bg-blue-800
              dark:bg-blue-500 dark:hover:bg-blue-400 dark:active:bg-blue-600

              text-white

              // Focus states with proper contrast
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-800

              // Smooth interaction feedback
              transition-all duration-200 ease-out
              active:scale-95
            "
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};
```

## Advanced Layout Patterns and Grid Systems

Master Tailwind's sophisticated layout utilities to create complex, responsive interfaces that maintain visual harmony across all screen sizes. Modern web interfaces require flexible layout systems that can adapt to varying content lengths, screen orientations, and user preferences. Tailwind provides comprehensive tools for creating these adaptive layouts through its flexbox and grid utilities.

When suggesting layout code, always consider the relationship between different interface elements and how they should respond to content changes. Use CSS Grid for two-dimensional layouts that require precise control over both rows and columns, while flexbox works best for one-dimensional layouts that need to adapt fluidly to content variations.

```typescript
// Advanced responsive grid layout with dynamic content adaptation
const ResponsiveGrid = ({ items }) => {
  return (
    <div className="
      // Container with responsive padding and maximum width
      px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto
    ">
      {/* Grid container with responsive column counts */}
      <div className="
        // Mobile: single column for focused reading
        grid grid-cols-1

        // Small screens: two columns for better space utilization
        sm:grid-cols-2

        // Medium screens: three columns for balanced layout
        md:grid-cols-3

        // Large screens: four columns with appropriate gaps
        lg:grid-cols-4

        // Responsive gap sizing
        gap-4 sm:gap-6 lg:gap-8
      ">
        {items.map((item, index) => (
          <div
            key={index}
            className="
              // Card styling with Material Design elevation
              bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md

              // Content spacing that scales with screen size
              p-4 sm:p-6

              // Smooth transitions for interaction feedback
              transition-all duration-300 ease-out

              // Interactive states
              hover:scale-105 hover:-translate-y-2
            "
          >
            {/* Image container with consistent aspect ratio */}
            <div className="
              aspect-square mb-4 rounded-lg overflow-hidden
              bg-gray-100 dark:bg-gray-700
            ">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content with responsive typography */}
            <h3 className="
              font-semibold text-gray-900 dark:text-white
              text-sm sm:text-base lg:text-lg
              leading-tight mb-2
            ">
              {item.title}
            </h3>

            <p className="
              text-gray-600 dark:text-gray-300
              text-xs sm:text-sm
              leading-relaxed
            ">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Component Composition and Reusability

Structure your styling approach around composable components that encapsulate common design patterns while remaining flexible enough to handle variations. The key to maintainable Tailwind implementations lies in identifying repeated styling patterns and abstracting them into reusable components that can be customized through props and composition.

When creating reusable styled components, design the API to accept styling customizations while maintaining consistent base styling. This approach prevents the proliferation of one-off styling solutions while ensuring that your design system remains coherent as your application grows in complexity.

```typescript
// Flexible button component that demonstrates proper Tailwind composition
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled = false,
  onClick
}) => {
  // Base styles that apply to all button variants
  const baseStyles = `
    inline-flex items-center justify-center rounded-xl font-medium
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    dark:focus:ring-offset-gray-800
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Size variations with consistent proportions
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Variant styles with proper dark mode support
  const variantStyles = {
    primary: `
      bg-blue-600 hover:bg-blue-700 active:bg-blue-800
      dark:bg-blue-500 dark:hover:bg-blue-400 dark:active:bg-blue-600
      text-white focus:ring-blue-500
    `,
    secondary: `
      bg-gray-600 hover:bg-gray-700 active:bg-gray-800
      dark:bg-gray-500 dark:hover:bg-gray-400 dark:active:bg-gray-600
      text-white focus:ring-gray-500
    `,
    outline: `
      border-2 border-blue-600 dark:border-blue-500
      text-blue-600 dark:text-blue-400
      hover:bg-blue-50 dark:hover:bg-blue-950
      active:bg-blue-100 dark:active:bg-blue-900
      focus:ring-blue-500
    `,
    ghost: `
      text-gray-600 dark:text-gray-400
      hover:bg-gray-100 dark:hover:bg-gray-800
      active:bg-gray-200 dark:active:bg-gray-700
      focus:ring-gray-500
    `
  };

  return (
    <button
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

## Performance Optimization and Class Management

Implement intelligent class composition patterns that maintain readability while optimizing for performance and maintainability. The cn (className) utility function becomes essential for managing complex conditional styling while ensuring that Tailwind's purging system can effectively remove unused styles from your production builds.

When composing classes dynamically, structure your logic to make the styling intentions clear while avoiding redundant class applications. This approach helps maintain clean code while ensuring optimal performance in production environments.

```typescript
// Utility for intelligent class composition and conditional styling
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Enhanced cn function that handles Tailwind class conflicts intelligently
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Example of complex conditional styling with proper class management
const ConditionalCard = ({
  isActive,
  isError,
  size = 'medium',
  children
}) => {
  return (
    <div className={cn(
      // Base styles that always apply
      'rounded-xl border transition-all duration-200 ease-out',

      // Size variations
      {
        'p-3 text-sm': size === 'small',
        'p-4 text-base': size === 'medium',
        'p-6 text-lg': size === 'large',
      },

      // State-based styling
      {
        // Default state
        'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700': !isActive && !isError,

        // Active state with enhanced styling
        'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 shadow-md': isActive && !isError,

        // Error state with appropriate warning styling
        'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 shadow-sm': isError,

        // Interactive states
        'hover:shadow-lg hover:scale-[1.02]': !isError,
        'cursor-not-allowed': isError,
      }
    )}>
      {children}
    </div>
  );
};
```

## Accessibility Integration

Weave accessibility considerations into every styling decision, using Tailwind's comprehensive accessibility utilities to create interfaces that work well for all users. Accessibility is not an additional feature to add later, but a fundamental design constraint that improves the experience for everyone while ensuring compliance with modern accessibility standards.

When suggesting styling code, always include appropriate focus states, color contrast considerations, and semantic HTML structures that support screen readers and other assistive technologies. These considerations should feel natural and integrated rather than added as an afterthought.

```typescript
// Accessible form component demonstrating comprehensive a11y integration
const AccessibleForm = () => {
  return (
    <form className="max-w-md mx-auto p-6 space-y-6">
      {/* Form field with proper labeling and error states */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="
            block text-sm font-medium text-gray-700 dark:text-gray-300
          "
        >
          Email Address
        </label>

        <input
          type="email"
          id="email"
          className="
            w-full px-3 py-2 border rounded-lg
            border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white

            // Focus states with proper contrast ratios
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            dark:focus:ring-blue-400 dark:focus:border-blue-400

            // Error states
            aria-[invalid]:border-red-500 aria-[invalid]:focus:ring-red-500

            // Disabled states
            disabled:bg-gray-100 dark:disabled:bg-gray-700
            disabled:text-gray-500 dark:disabled:text-gray-400
            disabled:cursor-not-allowed

            // Smooth transitions
            transition-colors duration-200
          "
          aria-describedby="email-error"
        />

        {/* Error message with proper ARIA labeling */}
        <p
          id="email-error"
          className="
            text-sm text-red-600 dark:text-red-400
            // Initially hidden, shown when needed
            hidden aria-[invalid]:block
          "
        >
          Please enter a valid email address
        </p>
      </div>

      {/* Submit button with comprehensive accessibility */}
      <button
        type="submit"
        className="
          w-full px-4 py-2 rounded-lg font-medium
          bg-blue-600 hover:bg-blue-700 active:bg-blue-800
          dark:bg-blue-500 dark:hover:bg-blue-400 dark:active:bg-blue-600
          text-white

          // Focus states with sufficient contrast
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-800

          // Loading and disabled states
          disabled:opacity-50 disabled:cursor-not-allowed

          // Smooth interactions
          transition-all duration-200 ease-out
          active:scale-95
        "
        // Proper ARIA attributes for dynamic states
        aria-describedby="submit-status"
      >
        Submit Form
      </button>
    </form>
  );
};
```

## Integration with Design Systems

Reference the official Tailwind CSS documentation at https://tailwindcss.com/docs for the most current utility classes and configuration options. The Tailwind ecosystem evolves rapidly, with new utilities and optimization patterns being introduced regularly. Staying current with the official documentation ensures that your styling patterns take advantage of the latest capabilities and follow current best practices.

When integrating with ShadCN components, reference the component documentation at https://ui.shadcn.com/docs to understand how the pre-built components handle styling customization and theming. ShadCN provides an excellent foundation of accessible, well-styled components that can be customized using Tailwind utilities while maintaining consistency with modern design patterns.

For projects using Kibo Commerce's design system, consult their design guidelines to understand how Tailwind utilities should be applied to maintain brand consistency while providing flexibility for custom implementations. The key is understanding how to work within established design constraints while leveraging Tailwind's utility system for implementation efficiency.

Remember that great Tailwind implementations feel intentional and cohesive rather than fragmented or arbitrary. Every utility class should serve a clear purpose in your overall design system, contributing to interfaces that feel polished, accessible, and delightful to use across all devices and user contexts.
