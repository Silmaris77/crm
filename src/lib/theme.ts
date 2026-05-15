export const theme = {
  colors: {
    primary: "#1e3c72",
    primaryDark: "#152b54",
    accent: "#3498db",
    success: "#27ae60",
    danger: "#e74c3c",
    warning: "#f39c12",
    neutral: {
      50: "#f9f9f9",
      100: "#f0f0f0",
      300: "#e0e0e0",
      600: "#999999",
      900: "#333333",
    },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    xxl: "24px",
  },
} as const;

export type AppTheme = typeof theme;
